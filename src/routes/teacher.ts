import { Response, Request, Router } from "express";
import TeacherDocument from "../model/Teacher";
import * as teacherService from "../service/teacher";
import Joi from "joi";
const router = Router();

import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter); // apply rate limiter to all requests

// validating the Student object to limit injections
const createTeacherSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

// validating the teacher object to limit injections
const updateTeacherSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

// getting all teachers
router.get("/", async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.getTeachers();
    res.json(teacher);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// getting a teacher by id
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const teacher = await teacherService.getTeacherById(id);
    if (!teacher) {
      return res.status(404).send("Teacher not found");
    }
    return res.json(teacher);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

// creating a teacher
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createTeacherSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  const { firstName, lastName, email, students } = value;
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
});

// updating a teacher
router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = updateTeacherSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedTeacher = await teacherService.updateTeacher(
      req.params.id,
      value
    );
    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(updatedTeacher);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// deleting a teacher
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
