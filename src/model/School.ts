import { Schema, Document, Date, model } from "mongoose";

export interface SchoolDocument extends Document {
  name: string;
  email: string;
  students: string[];
  teachers: string[];
  groups: string[];
  managedBy: string[];
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    teachers: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
    groups: [{ type: String }],
    managedBy: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false, id: true }
);

export default model<SchoolDocument>("School", SchoolSchema);
