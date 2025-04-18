import { Request, Response } from "express";
import StudentDocument from "../model/Student";
import * as studentService from "../service/studentService";

import Joi from "joi";

export async function getAll(req: Request, res: Response) {
  try {
    const student = await studentService.getStudents();
    res.json(student);
  } catch (error) {
    res.status(500).send("Server error");
  }
}

export async function getById(req: Request, res: Response): Promise<any> {
  try {
    const id = req.params.id;
    const student = await studentService.getStudentById(id);
    if (!student) {
      return res.status(404).send("Student not found");
    }
    return res.json(student);
  } catch (error) {
    return res.status(500).send("Server error");
  }
}

// validating the Student object to limit injections
const createStudentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().required(),
  sex: Joi.string().required(),
  exercises: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

export async function createStudent(
  req: Request,
  res: Response
): Promise<void> {
  const { error, value } = createStudentSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  const { firstName, lastName, email, exercises, age, sex } = value;
  const student = new StudentDocument({
    firstName,
    lastName,
    email,
    age,
    sex,
    exercises: exercises ?? [],
  });
  try {
    await studentService.saveStudent(student);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function importStudentsFromCSV(req: Request, res: Response) {
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

// validating the Student object to limit injections
const updateStudentSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  age: Joi.number().optional(),
  sex: Joi.string().optional(),
  exercises: Joi.array().items(Joi.string().hex().length(24)).optional(), // Exercises' ID
});

export async function updateStudent(req: Request, res: Response): Promise<any> {
  try {
    const { error, value } = updateStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedStudent = await studentService.updateStudent(
      req.params.id,
      value // instead of req.body
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(updatedStudent);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<any> {
  try {
    const deleted = await studentService.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Deleted Student" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
