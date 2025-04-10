import { Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import StudentModel from "../model/Student";
import Joi from "joi";

const router = Router();

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter);

//get all Students
router.get("/", async (req: Request, res: Response) => {
  try {
    const Student = await StudentModel.find();
    res.json(Student);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// getting a Student by id
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    //.populate("exercises") to get the exercises of the Student
    const Student = await StudentModel.findById(req.params.id).populate(
      "exercises"
    );
    if (!Student) {
      return res.status(404).send("Student not found");
    }
    return res.json(Student);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

// validating the Student object to limit injections
const createStudentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  exercises: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createStudentSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  const { firstName, lastName, email, exercises } = value;
  const student = new StudentModel({
    firstName,
    lastName,
    email,
    exercises: exercises ?? [],
  });
  try {
    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error creating a Student", error: err.message });
  }
});

// validating the Student object to limit injections
const updateStudentSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  exercises: Joi.array().items(Joi.string().hex().length(24)).optional(), // Exercises' ID
});

// updating an Student
router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = updateStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedStudent = await StudentModel.findByIdAndUpdate(
      req.params.id,
      value, // instead of req.body
      { new: true, runValidators: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(updatedStudent);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// deleting an Student
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await StudentModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Deleted Student" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
