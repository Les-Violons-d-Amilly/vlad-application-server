import { Schema, type Document, model } from "mongoose";

enum Sex {
  Female,
  Male,
}

export interface TeacherDocument extends Document {
  identity: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  refreshToken?: string;
  sex: Sex;
  avatar: string | null;
  online: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<TeacherDocument>(
  {
    identity: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    refreshToken: { type: String, required: false },
    sex: { type: Number, required: true },
    avatar: { type: String, default: null, required: false },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false, id: true }
);

export default model("Teacher", TeacherSchema);
