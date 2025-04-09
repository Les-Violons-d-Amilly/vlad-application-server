import mongoose, { Schema, Document } from "mongoose";
import type { Student } from "./Student";

export interface Teacher extends Document {
  firstName: string;
  lastName: string;
  email: string;
  students?: Student[];
}

const TeacherSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

export default mongoose.model<Teacher>("Teacher", TeacherSchema);
