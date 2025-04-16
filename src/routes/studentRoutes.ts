import * as studentController from "../controller/studentController";
import StudentModel from "../model/Student";

import { Request, Response, Router } from "express";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = Router();

import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter); // apply rate limiter to all requests

//get all Students
router.get("/", studentController.getAll);

// getting a Student by id
router.get("/:id", studentController.getById);

// creating a Student
router.post("/", studentController.createStudent);

// updating an Student
router.patch("/:id", studentController.updateStudent);

// deleting an Student
router.delete("/:id", studentController.deleteStudent);

router.post(
  "/import",
  upload.single("file"),
  studentController.importStudentsFromCSV
);
export default router;
