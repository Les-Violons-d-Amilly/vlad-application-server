import UserModel, { UserDocument } from "../model/User";
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

type UserInput = {
  name: string;
  password: string;
};

export async function register(user: UserInput): Promise<void> {
  await UserModel.create(user);
}

export async function login(user: UserInput): Promise<{ token: string }> {
  const foundUser = await UserModel.findOne({ name: { $eq: user.name } });
  if (!foundUser) throw new Error("Incorrect name");

  const isMatch = await bcrypt.compare(user.password, foundUser.password);
  if (!isMatch) throw new Error("Incorrect password");

  const token = jwt.sign({ id: foundUser._id }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { token };
}
