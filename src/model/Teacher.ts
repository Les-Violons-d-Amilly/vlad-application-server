import mongoose, { Schema, Document } from "mongoose";

export interface Teacher extends Document {
  firstName: string;
  lastName: string;
  email: string;
}

const TeacherSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

export default mongoose.model<Teacher>("Teacher", TeacherSchema);
