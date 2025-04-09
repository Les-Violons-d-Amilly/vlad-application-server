import mongoose, { Schema, Document } from "mongoose";

export interface Exercise extends Document {
  name: string;
  scores: {
    globalScore: number;
    scoreTable: {
      [score: string]: number;
    };
  };
}

const ExerciseSchema: Schema = new Schema({
  name: { type: String, required: true },
  scores: {
    globalScore: { type: Number, required: false },
    scoreTable: {
      type: Map,
      of: Number,
      required: false,
    },
  },
});

export default mongoose.model<Exercise>("Exercise", ExerciseSchema);
