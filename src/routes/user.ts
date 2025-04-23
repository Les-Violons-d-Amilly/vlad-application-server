import express, { Request, Response } from "express";
import { authenticateToken, CustomRequest } from "../authMiddleware";
import * as userService from "../service/user";
import omit from "../utils/omit";
import multer from "multer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import sharp from "sharp";
dotenv.config();

const upload = multer(); // Initialize multer for file uploads
const router = express.Router();

// Types
type PublicUser = Readonly<{
  firstName: string;
  lastName: string;
  avatar: string | null;
}>;

type ProtectedUser = PublicUser &
  Readonly<{
    email: string;
    login: string;
  }>;

type User = ProtectedUser &
  Readonly<{
    hash: string;
  }>;

// Register a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const user = req.body;
    await userService.register(user);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { accessToken, user, refreshToken } = await userService.login(
      req.body
    );

    res.status(200).json({
      user: omit(user, "hash"),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

router.post(
  "/logout",
  authenticateToken,
  async (req: CustomRequest, res: Response): Promise<any> => {
    try {
      const id = req.user?.id;
      if (!id) return res.sendStatus(401);

      const user = await userService.getById(id);
      if (!user) return res.sendStatus(404);

      user.refreshToken = undefined;
      await user.save();

      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(500).json({ message: "Logout failed" });
    }
  }
);

// Get current user
router.get(
  "/@me",
  authenticateToken,
  async (req: CustomRequest, res: Response): Promise<any> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const user = await userService.getUserFromToken(token);
      res.status(200).json(omit(user, "hash"));
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  }
);

// Update avatar
router.put(
  "/@me/avatar",
  authenticateToken,
  upload.single("avatar"),
  async (req: CustomRequest, res: Response): Promise<any> => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (
        !(
          file.mimetype.endsWith("png") ||
          file.mimetype.endsWith("jpeg") ||
          file.mimetype.endsWith("jpg")
        )
      ) {
        return res.status(400).json({ message: "Invalid file type" });
      }

      const token = req.headers.authorization?.split(" ")[1] || "";
      const user = await userService.getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = (user as any)._id?.toString();

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized (invalid ID)" });
      }

      const filename = `${userId}-${Date.now()}.png`;
      const uploadDir = path.join(__dirname, "..", "uploads", "avatars");
      const outputPath = path.join(uploadDir, filename);
      const publicPath = `/avatars/${filename}`;

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const pngBuffer = await sharp(file.buffer).png().toBuffer();
      fs.writeFileSync(outputPath, pngBuffer);

      const updatedUser = await userService.updateAvatar(userId, publicPath);

      res.status(200).json(updatedUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "error uploading avatar",
      });
    }
  }
);

// Delete user
router.delete(
  "/@me",
  authenticateToken,
  async (req: CustomRequest, res: Response): Promise<any> => {
    try {
      const id = req.user?.id;
      if (!id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await userService.deleteOne(id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
);

// Get user by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id;
      const user = await userService.getById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const publicUser: PublicUser = {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };
      res.status(200).json(publicUser);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
);

router.post(
  "/refresh-token",
  async (req: Request, res: Response): Promise<any> => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);
    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return res.status(500).json({ message: "JWT_SECRET is not defined" });
      }
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
      const user = await userService.getById(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.sendStatus(403);
      }
      const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: "15m",
      });
      res.status(200).json({ token: newAccessToken });
    } catch (error) {
      res.sendStatus(403);
    }
  }
);

export default router;
