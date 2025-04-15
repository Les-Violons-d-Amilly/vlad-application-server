import Exercise, { ExerciseDocument } from "../model/Exercise";

export async function getExercise(): Promise<any> {
  try {
    const exercises = await Exercise.find();
    return exercises;
  } catch (error: any) {
    throw new Error("Error fetching exercises: " + error);
  }
}

export async function getExerciseById(
  id: string
): Promise<ExerciseDocument | null> {
  try {
    const exercise = await Exercise.findById(id);
    return exercise;
  } catch (error: any) {
    throw new Error("Error fetching exercise by ID: " + error);
  }
}

export async function saveExercise(
  exerciseData: ExerciseDocument
): Promise<ExerciseDocument> {
  try {
    const newExercise = new Exercise(exerciseData);
    await newExercise.save();
    return newExercise;
  } catch (error: any) {
    throw new Error("Error creating exercise: " + error);
  }
}
