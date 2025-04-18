import UserModel, { UserDocument } from "../model/User";
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

export async function register(user: UserDocument): Promise<void> {
  await UserModel.create(user);
}

export async function login(user: UserDocument): Promise<{ token: string }> {
  const foundUser = await UserModel.findOne({ login: { $eq: user.login } });
  if (!foundUser) throw new Error("Incorrect name");

  const isMatch = await bcrypt.compare(user.hash, foundUser.hash);
  if (!isMatch) throw new Error("Incorrect hash");

  const token = jwt.sign({ id: foundUser._id }, JWT_SECRET, {
    //expiresIn: "1h",
  });

  return { token };
}

export async function getById(id: string): Promise<UserDocument | null> {
  try {
    const user = await UserModel.findById(id);
    return user;
  } catch (error: any) {
    throw new Error("Error fetching user by ID: " + error);
  }
}

export async function deleteOne(id: string): Promise<void> {
  try {
    const user = await UserModel.findByIdAndDelete(id);
  } catch (error: any) {
    throw new Error("Error deleting user: " + error);
  }
}

export async function getUserFromToken(token: string): Promise<UserDocument> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await UserModel.findById(decoded.id);
    if (!user) throw new Error("User not found");
    return user;
  } catch (err) {
    throw new Error("Invalid token");
  }
}

export async function Authentification(
  user: UserDocument
): Promise<{ token: string; login: string }> {
  const foundUser = await UserModel.findOne({ login: { $eq: user.login } });
  if (!foundUser) throw new Error("Incorrect login");

  const isMatch = await bcrypt.compare(user.hash, foundUser.hash);
  if (!isMatch) throw new Error("Incorrect hash");

  const token = jwt.sign({ id: foundUser._id }, JWT_SECRET, {
    //expiresIn: "1h",
  });
  const login = makeIdentity(foundUser);
  if (!login) throw new Error("Login not found");

  return { token, login };
}

function makeIdentity(user: UserDocument): string {
  return user.login.toLowerCase().replace(/[^a-z]/g, "");
}
