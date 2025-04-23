import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends Document {
  identity: string;
  hash: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

const UserSchema = new mongoose.Schema<UserDocument>({
  identity: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: null, required: false },
});

// pre('save') allow to hash password before saving to DB
UserSchema.pre("save", async function (next) {
  if (!this.isModified("hash")) return next();
  this.hash = await bcrypt.hash(this.hash, 8);
  next();
});

const UserModel = mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
