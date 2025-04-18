import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends Document {
  login: string;
  hash: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

const UserSchema = new mongoose.Schema<UserDocument>({
  login: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: null, required: false },
});

// pre('save') allow to hash password before saving to DB
UserSchema.pre("save", async function (next) {
  const user = this as UserDocument;
  if (user.isModified("hash")) {
    user.hash = await bcrypt.hash(user.hash, 8);
  }
  next();
});

const UserModel = mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
