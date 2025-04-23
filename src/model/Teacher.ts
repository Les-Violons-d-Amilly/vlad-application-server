import mongoose, { Schema, Document } from "mongoose";

export interface TeacherDocument extends Document {
  identity: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  refreshToken?: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema(
  {
    identity: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    refreshToken: { type: String, required: false },
    avatar: { type: String, default: null, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false, id: true }
);

export default mongoose.model<TeacherDocument>("Teacher", TeacherSchema);
