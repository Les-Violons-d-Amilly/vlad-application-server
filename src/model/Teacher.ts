import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import type UserDocument from "./User";
import { Sex } from "./User";

const TeacherSchema = new Schema<UserDocument>(
  {
    identity: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    hash: { type: String, required: true },
    provisoryPassword: { type: Boolean, default: true },
    refreshToken: { type: String, required: false },
    sex: { type: String, enum: Sex, required: true },
    avatar: { type: String, default: null, required: false },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
    id: true,
    methods: {
      verifyPassword: async function (password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.hash);
      },
    },
  }
);

TeacherSchema.pre("save", async function (next) {
  if (!this.isModified("hash")) return next();
  this.hash = await bcrypt.hash(this.hash, 8);
  next();
});

TeacherSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default model("Teacher", TeacherSchema);
