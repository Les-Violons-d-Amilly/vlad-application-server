import mongoose, { Schema, Document } from "mongoose";

interface Exercise extends Document {
  Exercise: {
    globalScore: number;
    scoreTable: {
      [score: string]: number;
    };
  };
}

const ExerciseSchema: Schema = new Schema({
  Exercise: {
    globalScore: { type: Number, required: false },
    scoreTable: {
      type: Map,
      of: Number,
      required: false,
    },
  },
});

export default mongoose.model<Exercise>("Exercise", ExerciseSchema);
