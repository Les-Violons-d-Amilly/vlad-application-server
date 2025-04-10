import { Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import ExerciseModel from "../model/Exercise";
import Joi from "joi";

const router = Router();

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter);

//get all exercises
router.get("/", async (req: Request, res: Response) => {
  try {
    const exercise = await ExerciseModel.find();
    res.json(exercise);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// getting an exercise by id
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const exercise = await ExerciseModel.findById(req.params.id);
    if (!exercise) {
      return res.status(404).send("exercise not found");
    }
    return res.json(exercise);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

// creating an exercise
router.post("/", async (req: Request, res: Response) => {
  const { name, globalScore, scores } = req.body;
  const exercise = new ExerciseModel({
    name,
    globalScore,
    scores,
  });
  try {
    const savedExercise = await exercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    res.status(400).json({ message: "Error creating an Exercise" });
  }
});

// validating the exercise object to limit injections

const updateExerciseSchema = Joi.object({
  name: Joi.string().optional(),
  globalScore: Joi.number().optional(),
  scores: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
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
