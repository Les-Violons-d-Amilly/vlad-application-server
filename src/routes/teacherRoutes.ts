import { Response, Request, Router } from "express";
import TeacherModel from "../model/Teacher";
import Joi from "joi";
import { group } from "console";

const router = Router();

import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter); // apply rate limiter to all requests

// getting all teachers
router.get("/", async (req: Request, res: Response) => {
  try {
    const teachers = await TeacherModel.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// getting a teacher by id
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const teacher = await TeacherModel.findById(req.params.id).populate(
      "groups"
    );
    if (!teacher) {
      return res.status(404).send("Teacher not found");
    }
    return res.json(teacher);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

// validating the teacher object to limit injections
const createTeacherSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  groups: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

// creating a teacher
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createTeacherSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  const { firstName, lastName, email, groups } = value;
  const teacher = new TeacherModel({
    firstName,
    lastName,
    email,
    groups: groups ?? [],
  });
  try {
    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error creating a Teacher", error: err.message });
  }
});

// validating the teacher object to limit injections
const updateTeacherSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  groups: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

// updating a teacher
router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = updateTeacherSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedTeacher = await TeacherModel.findByIdAndUpdate(
      req.params.id,
      value, // instead of req.body
      { new: true, runValidators: true }
    );
    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(updatedTeacher);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// deleting a teacher
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await TeacherModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ message: "Deleted teacher" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
