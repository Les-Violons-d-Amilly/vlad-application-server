import mongoose from "mongoose";
import { Teacher } from "./teacherInterface";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model<Teacher>("Teacher", teacherSchema);
