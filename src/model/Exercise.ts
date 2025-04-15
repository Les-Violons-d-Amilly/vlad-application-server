import mongoose, { Schema, Document, Date } from "mongoose";

export interface ExerciseDocument extends Document {
  name: string;
  globalScore?: number;
  noteReading?: string;
  numberOfErrors?: number;
  reactionTime?: number;
  errorDetails?: string[];
  date: Date;
}

const ExerciseSchema: Schema = new Schema({
  name: { type: String, required: true },
  globalScore: { type: Number, required: false },
  noteReading: { type: String, required: false },
  numberOfErrors: { type: Number, required: false },
  reactionTime: { type: Number, required: false }, // in milliseconds for example
  errorDetails: [{ type: String, required: false }],
  date: { type: Date, required: false, default: Date.now }, // default to current date
});

export default mongoose.model<ExerciseDocument>("Exercise", ExerciseSchema);
