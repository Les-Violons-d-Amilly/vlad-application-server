import "dotenv/config";
import { Router } from "express";
import omit from "../utils/omit";
import { CustomRequest } from "../utils/authentication";
import { deleteOne, getById } from "../service/user";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { importStudentsFromCSV } from "../service/student";

const router = Router();
const upload = multer();

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  try {
    const students = await importStudentsFromCSV(req.file.filename);
    res.status(201).json({ message: "Import successful", students });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error importing CSV", error: err.message });
  }
});

router.get("/@me", async (req, res): Promise<any> => {
  try {
    res
      .status(200)
      .json(omit((req as CustomRequest).user.toJSON(), "hash", "refreshToken"));
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

router.delete("/@me", async (req, res): Promise<any> => {
  try {
    await deleteOne((req as CustomRequest).user.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.put(
  "/@me/avatar",
  upload.single("avatar"),
  async (req, res): Promise<any> => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!/png|jpe?g/i.test(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const user = (req as CustomRequest).user;
    const fileName = `${user.id}-${Date.now()}.png`;
    const uploadDir = path.join(__dirname, "../uploads/avatars");
    const outputPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    try {
      await sharp(req.file.buffer)
        .resize(256, 256, { fit: "cover" })
        .png()
        .toFile(outputPath);

      user.avatar = fileName;
      await user.save();

      res.status(200).json({
        message: "Avatar updated successfully",
        avatar: fileName,
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing image" });
    }
  }
);

router.delete("/@me/avatar", async (req, res): Promise<any> => {
  try {
    const user = (req as CustomRequest).user;

    if (!user.avatar) {
      return res.status(400).json({ message: "No avatar to delete" });
    }

    const avatarPath = path.join(__dirname, "../uploads/avatars", user.avatar);

    fs.unlinkSync(avatarPath);
    user.avatar = null;
    await user.save();
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.get("/:id", async (req, res): Promise<any> => {
  try {
    const user = await getById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

export default router;
