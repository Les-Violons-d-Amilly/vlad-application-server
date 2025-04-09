import mongoose, { Schema, Document } from "mongoose";

export interface Exercise extends Document {
  name: string;
  globalScore?: number;
  scores: {
    subPartMap: {
      [name: string]: number;
    };
  };
}

const ExerciseSchema: Schema = new Schema({
  name: { type: String, required: true },
  globalScore: { type: Number, required: false },
  scores: {
    subPartMap: {
      type: Map,
      of: Number,
      required: false,
    },
  },
});

export default mongoose.model<Exercise>("Exercise", ExerciseSchema);
