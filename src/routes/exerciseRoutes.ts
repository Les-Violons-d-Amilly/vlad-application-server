import { Request, Response, Router } from "express";
import * as exerciseController from "../controller/exerciseController";
import ExerciseModel from "../model/Exercise";
import Joi from "joi";

const router = Router();

import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter); // apply rate limiter to all requests

//get all exercises

router.get("/", exerciseController.getAll);
// getting an exercise by id
router.get("/:id", exerciseController.getById);

// creating an exercise
router.post("/", exerciseController.createExercise);

// updating an exercise
router.patch("/:id", exerciseController.updateExercise);

// deleting an exercise
router.delete("/:id", exerciseController.deleteExercise);

export default router;
