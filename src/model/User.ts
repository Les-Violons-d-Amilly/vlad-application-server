import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends Document {
  name: string;
  password: string;
}

const UserSchema = new mongoose.Schema<UserDocument>({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// pre('save') allow to hash password before saving to DB
UserSchema.pre("save", async function (next) {
  const user = this as UserDocument;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const UserModel = mongoose.model<UserDocument>("User", UserSchema);
export default UserModel;
