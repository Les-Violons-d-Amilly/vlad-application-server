import mongoose, { Schema, Document } from "mongoose";
import type { StudentDocument } from "./Student";

export interface TeacherDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  student?: StudentDocument[];
}

const TeacherSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

export default mongoose.model<TeacherDocument>("Teacher", TeacherSchema);
