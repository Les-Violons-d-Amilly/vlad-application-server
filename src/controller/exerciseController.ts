import { Request, Response } from "express";
import ExerciseDocument from "../model/Exercise";
import * as exerciseService from "../service/exerciseService";

import Joi from "joi";

export async function getAll(req: Request, res: Response) {
  try {
    const exercise = await exerciseService.getExercises();
    res.json(exercise);
  } catch (error) {
    res.status(500).send("Server error");
  }
}

export async function getById(req: Request, res: Response): Promise<any> {
  try {
    const id = req.params.id;
    const exercise = await exerciseService.getExerciseById(id);
    if (!exercise) {
      return res.status(404).send("exercise not found");
    }
    return res.json(exercise);
  } catch (error) {
    return res.status(500).send("Server error");
  }
}

export async function createExercise(
  req: Request,
  res: Response
): Promise<void> {
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
}

//validating the Exercise object to limit injections
const updateExerciseSchema = Joi.object({
  name: Joi.string().optional(),
  globalScore: Joi.number().optional(),
  noteReading: Joi.string().optional(),
  numberOfErrors: Joi.number().optional(),
  reactionTime: Joi.number().optional(),
  errorDetails: Joi.array().items(Joi.string()).optional(),
});

export async function updateExercise(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const { error, value } = updateExerciseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedExercise = await exerciseService.updateExercise(
      req.params.id,
      value // instead of req.body
    );
    if (!updatedExercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(updatedExercise);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteExercise(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const deleted = await exerciseService.deleteExercise(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json({ message: "Deleted Exercise" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
