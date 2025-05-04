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
import sendEmail from "../utils/sendEmail";

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
    } catch (error) {
      res.status(500).json({ message: "" + error });
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
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

router.get("/reset-password/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user.id) {
      res.status(401).json({ message: "Empty request" });
      return;
    }

    const teacher = await getTeacherById(req.params.id);

    if (!teacher) {
      res.status(404).json({ message: "Teacher not found" });
      return;
    }

    await sendEmail(
      teacher.email,
      "Réinitialisation de mot de passe",
      /* html */ `
      <h1 style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Bonjour ${teacher.firstName} ${teacher.lastName}</h1>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${process.env.FRONTEND_URL}/resetpassword/${teacher._id}">Réinitialiser le mot de passe</a>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Cordialement,</p>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">L'équipe de Vlad</p>
      `
    );
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

export default router;
