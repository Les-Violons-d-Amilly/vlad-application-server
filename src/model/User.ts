import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

type DurationPerDate = {
  date: string;
  duration: number;
};

enum Sex {
  Female,
  Male,
}

export interface UserDocument extends Document {
  identity: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  refreshToken?: string;
  age: number;
  sex: Sex;
  avatar: string | null;
  timeOnApp: DurationPerDate[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    identity: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    refreshToken: { type: String, required: false },
    avatar: { type: String, default: null, required: false },
    age: { type: Number, required: true },
    sex: { type: Number, required: true },
    timeOnApp: {
      type: [
        {
          date: { type: String, required: true },
          duration: { type: Number, required: true },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false, id: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("hash")) return next();
  this.hash = await bcrypt.hash(this.hash, 8);
  next();
});

UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const UserModel = mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
