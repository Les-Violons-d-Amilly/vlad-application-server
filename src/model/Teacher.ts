import { Schema, model } from "mongoose";
import type UserDocument from "./User";

const TeacherSchema = new Schema<UserDocument>(
  {
    identity: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
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
