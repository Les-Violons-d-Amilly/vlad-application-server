import mongoose from "mongoose";
import { Teacher } from "./teacherInterface";

const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model<Teacher>("Teacher", teacherSchema);
