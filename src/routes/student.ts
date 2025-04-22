import { Router, Request, Response } from "express";
import StudentDocument from "../model/Student";
import * as studentService from "../service/student";
import Joi from "joi";
import rateLimit from "express-rate-limit";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter);

// Validation schemas
const createStudentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().required(),
  sex: Joi.string().required(),
  className: Joi.string().required(),
  exercises: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

const updateStudentSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  age: Joi.number().optional(),
  sex: Joi.string().optional(),
  className: Joi.string().optional(),
  exercises: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

// Get all students
router.get("/", async (req: Request, res: Response) => {
  try {
    const students = await studentService.getStudents();
    res.json(students);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Get student by ID
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).send("Student not found");
    }
    res.json(student);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Create a student
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createStudentSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const { firstName, lastName, email, exercises, age, sex, className } = value;
  const student = new StudentDocument({
    firstName,
    lastName,
    email,
    age,
    sex,
    className,
    exercises: exercises ?? [],
  });

  try {
    await studentService.saveStudent(student);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Import students from CSV
router.post(
  "/csv",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    try {
      const students = await studentService.importStudentsFromCSV(
        req.file.filename
      );
      res.status(201).json({ message: "Import successful", students });
    } catch (err: any) {
      res
        .status(500)
        .json({ message: "Error importing CSV", error: err.message });
    }
  }
);

// Update a student
router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  const { error, value } = updateStudentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const updatedStudent = await studentService.updateStudent(
      req.params.id,
      value
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(updatedStudent);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a student
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await studentService.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Deleted Student" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
