import "dotenv/config";
import { Router } from "express";
import omit from "../utils/omit";
import { deleteOne, getStudentById, registerManyUsers } from "../service/user";
import multer from "multer";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { PermissionLevel } from "../utils/authentication";
import { parseStudentCsv } from "../utils/parseCsv";
import {
  addLevelResultToStudent,
  getLevelResultsByStudentId,
  deleteLevelResultFromStudent,
} from "../service/student";

const router = Router();
const upload = multer();

router.post("/import", upload.single("file"), async (req, res) => {
  /**
   * @openapi
   * /api/students/import:
   *   post:
   *     tags:
   *       - Students
   *     summary: Import students from CSV file
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Students registered successfully
   *       400:
   *         description: No file uploaded
   *       500:
   *         description: Error importing CSV
   */
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

router.put("/@me/levelResult", async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/students/@me/levelResult:
   *   put:
   *     tags:
   *       - Students
   *     summary: Add level result to yourself through token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               levelResultId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Level result saved successfully
   *       400:
   *         description: Missing levelResultId
   *       500:
   *         description: Server error
   */
  const { levelResultId } = req.body;

  if (!levelResultId) {
    return res.status(400).json({ message: "Missing levelResultId" });
  }

  try {
    const newResult = await addLevelResultToStudent(req.user.id, levelResultId);
    res.status(200).json({ message: "Level result saved", result: newResult });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/@me/levelResult", async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/students/@me/levelResult:
   *   get:
   *     tags:
   *       - Students
   *     summary: Get your level results through token
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  const LevelResults = await getLevelResultsByStudentId(req.user.id);
  try {
    res.status(200).json(LevelResults);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/@me/levelResult/:id", async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/students/@me/levelResult/{id}:
   *   delete:
   *     tags:
   *       - Students
   *     summary: Delete your level result through token
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Level result deleted successfully
   *       404:
   *         description: User or level result not found
   *       500:
   *         description: Server error
   */
  try {
    const levelResultId = req.params.id;
    const studentId = req.user.id;

    await deleteLevelResultFromStudent(studentId, levelResultId);
    if (!mongoose.isValidObjectId(levelResultId)) {
      return res.status(400).json({ message: "Invalid levelResultId format" });
    }
    res.status(200).json({ message: "Level result deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
    /**
     * @openapi
     * /api/students/@me/avatar:
     *   put:
     *     tags:
     *       - Students
     *     summary: Update your avatar
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               avatar:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Avatar updated successfully
     *       400:
     *         description: Invalid file type or no file uploaded
     *       500:
     *         description: Server error while processing the image
     */
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
