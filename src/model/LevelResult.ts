import { Schema, Document, Date, model } from "mongoose";

export interface LevelResultDocument extends Document {
  name: string;
  globalScore?: number;
  noteReading?: string;
  numberOfErrors?: number;
  reactionTime?: number;
  errorDetails?: string[];
  createdAt: Date;
  duration: number;
}

const LevelResultSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    globalScore: { type: Number, required: false },
    noteReading: { type: String, required: false },
    numberOfErrors: { type: Number, required: false },
    reactionTime: { type: Number, required: false },
    errorDetails: [{ type: String, required: false }],
    duration: { type: Number, required: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false, id: true }
);

export default model<LevelResultDocument>("LevelResult", LevelResultSchema);
