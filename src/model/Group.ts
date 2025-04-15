import mongoose, { Schema, Document } from "mongoose";
import type { StudentDocument } from "./Student";

export interface Group extends Document {
  name: string;
  students?: StudentDocument[];
}

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

export default mongoose.model<Group>("Group", GroupSchema);
