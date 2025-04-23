import { Router, Request, Response } from "express";
import ExerciseDocument from "../model/Exercise";
import * as exerciseService from "../service/exercise";
import Joi from "joi";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter);

// Schema for update validation
const updateExerciseSchema = Joi.object({
  name: Joi.string().optional(),
  globalScore: Joi.number().optional(),
  noteReading: Joi.string().optional(),
  numberOfErrors: Joi.number().optional(),
  reactionTime: Joi.number().optional(),
  errorDetails: Joi.array().items(Joi.string()).optional(),
});

// Get all exercises
router.get("/", async (req: Request, res: Response) => {
  try {
    const exercises = await exerciseService.getExercises();
    res.json(exercises);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Get an exercise by ID
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const exercise = await exerciseService.getExerciseById(id);
    if (!exercise) {
      return res.status(404).send("Exercise not found");
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Create a new exercise
router.post("/", async (req: Request, res: Response) => {
  const {
    name,
    globalScore,
    noteReading,
    numberOfErrors,
    reactionTime,
    errorDetails,
  } = req.body;

  const exercise = new ExerciseDocument({
    name,
    globalScore,
    noteReading,
    numberOfErrors,
    reactionTime,
    errorDetails,
    date: new Date(),
  });

  try {
    const savedExercise = await exerciseService.saveExercise(exercise);
    res.status(201).json(savedExercise);
  } catch (error) {
    res.status(400).json({ message: "Error creating an Exercise" });
  }
});

// Update an existing exercise
router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = updateExerciseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedExercise = await exerciseService.updateExercise(
      req.params.id,
      value
    );

    if (!updatedExercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json(updatedExercise);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an exercise
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await exerciseService.deleteExercise(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json({ message: "Deleted Exercise" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
