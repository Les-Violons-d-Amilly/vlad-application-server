import mongoose, { Schema, Document } from "mongoose";
import type { Group } from "./Group";

export interface Teacher extends Document {
  firstName: string;
  lastName: string;
  email: string;
  groups?: Group[];
}

const TeacherSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
});

export default mongoose.model<Teacher>("Teacher", TeacherSchema);
