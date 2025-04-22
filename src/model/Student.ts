import mongoose, { Schema, Document } from "mongoose";
import type { ExerciseDocument } from "./Exercise";

export interface StudentDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  sex: string;
  className: string;
  exercises?: ExerciseDocument[];
}

const StudentSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  sex: { type: String, required: true },
  className: { type: String, required: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
});

export default mongoose.model<StudentDocument>("Student", StudentSchema);
