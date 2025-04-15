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

// validating the exercise object to limit injections

const updateExerciseSchema = Joi.object({
  name: Joi.string().optional(),
  globalScore: Joi.number().optional(),
  noteReading: Joi.string().optional(),
  numberOfErrors: Joi.number().optional(),
  reactionTime: Joi.number().optional(),
  errorDetails: Joi.array().items(Joi.string()).optional(),
  //date: Joi.array()
});

// updating an exercise
router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = updateExerciseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedExercise = await ExerciseModel.findByIdAndUpdate(
      req.params.id,
      value, // instead of req.body
      { new: true, runValidators: true }
    );
    if (!updatedExercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(updatedExercise);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// deleting an exercise
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await ExerciseModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json({ message: "Deleted Exercise" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
