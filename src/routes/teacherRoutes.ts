import { Response, Request, Router } from "express";
import rateLimit from "express-rate-limit";
import TeacherModel from "../model/Teacher";
import Joi from "joi";

const router = Router();

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter);

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
    const teacher = await TeacherModel.findById(req.params.id);
    if (!teacher) {
      return res.status(404).send("Teacher not found");
    }
    return res.json(teacher);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

// creating a teacher
router.post("/", async (req: Request, res: Response) => {
  const { firstName, lastName, email } = req.body;
  const teacher = new TeacherModel({
    firstName,
    lastName,
    email,
  });
  try {
    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    res.status(400).json({ message: "Error creating teacher" });
  }
});

// validating the teacher object to limit injections
const updateTeacherSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
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
