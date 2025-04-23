import express, { Request, Response } from "express";
import { authenticateToken, CustomRequest } from "../authMiddleware";
import * as userService from "../service/user";
import omit from "../utils/omit";

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
    const { token, user } = await userService.login(req.body);

    res.status(200).json({
      token,
      user: omit(user, "hash"),
    });
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

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
  async (req: CustomRequest, res: Response): Promise<any> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const { avatar } = req.body;

      if (typeof avatar !== "string" || avatar.trim() === "") {
        return res.status(400).json({ message: "Invalid avatar format" });
      }

      const user = await userService.getUserFromToken(token);
      const updatedUser = await userService.updateAvatar(user.id, avatar);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
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

export default router;
