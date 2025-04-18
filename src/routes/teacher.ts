import { Response, Request, Router } from "express";
import TeacherModel from "../model/Teacher";
import * as teacherController from "../controller/teacherController";

const router = Router();

import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter); // apply rate limiter to all requests

// getting all teachers
router.get("/", teacherController.getAll);

// getting a teacher by id
router.get("/:id", teacherController.getById);

// creating a teacher
router.post("/", teacherController.createTeacher);

// updating a teacher
router.patch("/:id", teacherController.updateTeacher);

// deleting a teacher
router.delete("/:id", teacherController.deleteTeacher);

export default router;
