import { type Document, model, Schema } from "mongoose";
import bcrypt from "bcrypt";

type DurationPerDate = {
  date: string;
  duration: number;
};

enum Sex {
  Female,
  Male,
}

export interface StudentDocument extends Document {
  identity: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  refreshToken?: string;
  age: number;
  sex: Sex;
  avatar: string | null;
  group: string;
  timeOnApp: DurationPerDate[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<StudentDocument>(
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
    group: { type: String, required: false },
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

StudentSchema.pre("save", async function (next) {
  if (!this.isModified("hash")) return next();
  this.hash = await bcrypt.hash(this.hash, 8);
  next();
});

StudentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default model<StudentDocument>("User", StudentSchema);
