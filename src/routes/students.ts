import "dotenv/config";
import { Router } from "express";
import omit from "../utils/omit";
import { deleteOne, getStudentById, registerManyUsers } from "../service/user";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { PermissionLevel } from "../utils/authentication";
import { parseStudentCsv } from "../utils/parseCsv";

const router = Router();
const upload = multer();

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  try {
    const students = await parseStudentCsv(req.file.buffer);
    await registerManyUsers(students);

    res
      .status(201)
      .json({ message: `Registered ${students.length} students.` });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error importing CSV", error: err.message });
  }
});

router.get("/@me", async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/students/@me:
   *   get:
   *     tags:
   *       - Students
   *     summary: Get yourself through token
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  try {
    res.status(200).json(omit(req.user.toJSON(), "hash", "refreshToken"));
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

router.delete("/@me", async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/students/@me:
   *   delete:
   *     tags:
   *       - Students
   *     summary: Delete yourself through token
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  try {
    await deleteOne(req.user.id);
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

    const fileName = `${req.user.id}-${Date.now()}.png`;
    const uploadDir = path.join(__dirname, "../../uploads");
    const outputPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    try {
      await sharp(req.file.buffer)
        .resize(256, 256, { fit: "cover" })
        .png()
        .toFile(outputPath);

      req.user.avatar = fileName;
      await req.user.save();

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
  /**
   * @openapi
   * /api/students/@me/avatar:
   *   delete:
   *     tags:
   *       - Students
   *     summary: Delete your avatar
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  try {
    if (!req.user.avatar) {
      return res.status(400).json({ message: "No avatar to delete" });
    }

    const avatarPath = path.join(__dirname, "../../uploads", req.user.avatar);

    fs.unlinkSync(avatarPath);
    req.user.avatar = null;
    await req.user.save();
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.get("/:id", async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/students/{id}:
   *   get:
   *     tags:
   *       - Students
   *     summary: Get student by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  try {
    const user = await getStudentById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.permissionLevel === PermissionLevel.Student) {
      res
        .status(200)
        .json(
          omit(
            user.toJSON(),
            "hash",
            "refreshToken",
            "email",
            "provisoryPassword"
          )
        );
    } else {
      res.status(200).json(omit(user.toJSON(), "hash", "refreshToken"));
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

export default router;
