import { Response, Request, Router } from "express";
import TeacherDocument from "../model/Teacher";
import {
  updateTeacherSchema,
  createTeacherSchema,
} from "../validation/teacherSchemas";
import * as teacherService from "../service/teacher";
import { validateBody } from "../utils/joiValidation";
const router = Router();

import rateLimit from "express-rate-limit";
import { getTeacherById } from "../service/user";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter);

router.get("/", async (req: Request, res: Response) => {
  /**
   * @openapi
   * /api/teachers:
   *   get:
   *     tags:
   *       - Teachers
   *     summary: Get all teachers
   *     responses:
   *       200:
   *         description: Success
   *       500:
   *         description: Server error
   */
  try {
    const teacher = await teacherService.getTeachers();
    res.json(teacher);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/@me", async (req: Request, res: Response): Promise<any> => {
  /**
   * @openapi
   * /api/teachers/@me:
   *   get:
   *     tags:
   *       - Teachers
   *     summary: Get yourself through token
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Server error
   */
  try {
    const teacher = await getTeacherById(req.user.id);
    if (!teacher) {
      return res.status(404).send("Teacher not found");
    }
    return res.json(teacher);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  /**
   * @openapi
   * /api/teachers/{id}:
   *   get:
   *     tags:
   *       - Teachers
   *     summary: Get teacher by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the teacher
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Server error
   */
  try {
    const id = req.params.id;
    const teacher = await getTeacherById(id);
    if (!teacher) {
      return res.status(404).send("Teacher not found");
    }
    return res.json(teacher);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

router.post(
  "/",
  validateBody(createTeacherSchema),
  async (req: Request, res: Response): Promise<void> => {
    /**
     * @openapi
     * /api/teachers:
     *   post:
     *     tags:
     *       - Teachers
     *     summary: Create a new teacher
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - firstName
     *               - lastName
     *               - email
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               email:
     *                 type: string
     *               students:
     *                 type: array
     *                 items:
     *                   type: string
     * */
    const { firstName, lastName, email, students } = req.body;
    const teacher = new TeacherDocument({
      firstName,
      lastName,
      email,
      students: students ?? [],
    });
    try {
      await teacherService.saveTeacher(teacher);
      res.status(201).json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch(
  "/:id",
  validateBody(updateTeacherSchema),
  async (req: Request, res: Response): Promise<any> => {
    /**
     * @openapi
     * /api/teachers/{id}:
     *   patch:
     *     tags:
     *       - Teachers
     *     summary: Update a teacher by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The ID of the teacher
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: Success
     *       404:
     *         description: Teacher not found
     *       500:
     *         description: Server error
     */
    try {
      const updatedTeacher = await teacherService.updateTeacher(
        req.params.id,
        req.body
      );

      if (!updatedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      res.json(updatedTeacher);
    } catch (error) {
      res.status(500).json({ message: "" + error });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  /**
   * @openapi
   * /api/teachers/{id}:
   *   delete:
   *     tags:
   *       - Teachers
   *     summary: Delete a teacher by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the teacher
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Server error
   */
  try {
    const deleted = await teacherService.deleteTeacher(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ message: "Deleted teacher" });
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

export default router;
