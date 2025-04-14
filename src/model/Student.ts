import mongoose, { Schema, Document } from "mongoose";
import type { Exercise } from "./Exercise";

export interface Student extends Document {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  exercises?: Exercise[];
}

const StudentSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
});

export default mongoose.model<Student>("Student", StudentSchema);
