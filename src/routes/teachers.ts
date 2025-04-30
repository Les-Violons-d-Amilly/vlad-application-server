import { Response, Request, Router } from "express";
import TeacherDocument, {
  updateTeacherSchema,
  createTeacherSchema,
} from "../model/Teacher";
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
  try {
    const teacher = await teacherService.getTeachers();
    res.json(teacher);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/@me", async (req: Request, res: Response): Promise<any> => {
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
    try {
      const updatedTeacher = await teacherService.updateTeacher(
        req.params.id,
        req.body
      );

      if (!updatedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      res.json(updatedTeacher);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await teacherService.deleteTeacher(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ message: "Deleted teacher" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
