import { Request, Response } from "express";
import ExerciseModel from "../model/Exercise";
import * as exerciseService from "../service/exerciseService";

import Joi from "joi";
import rateLimit from "express-rate-limit";

export async function getAll(req: Request, res: Response) {
  try {
    const exercise = await exerciseService.getExercise();
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
  const exercise = new ExerciseModel({
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
