import UserModel, { UserDocument } from "../model/User";
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

enum Sex {
  Female,
  Male,
}

type RegisterProps = Readonly<{
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  sex: Sex;
  age: number;
}>;

type LoginProps = Readonly<{
  identity: string;
  password: string;
}>;

export async function register(user: RegisterProps): Promise<void> {
  let identity =
    user.firstName[0].toLowerCase() +
    user.lastName
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 7);

  const existingIdentities = await UserModel.countDocuments({
    identity: { $regex: new RegExp(`^${identity}\\d*$`) },
  });

  if (existingIdentities) identity += existingIdentities + 1;

  await UserModel.create({
    firstName: user.firstName.toLowerCase(),
    lastName: user.lastName.toLowerCase(),
    identity: identity,
    hash: user.password,
    email: user.email,
    sex: user.sex,
    age: user.age,
  });
}

export async function login(
  user: LoginProps
): Promise<{ accessToken: string; user: UserDocument; refreshToken: string }> {
  const foundUser = await UserModel.findOne({ identity: user.identity });
  if (!foundUser) throw new Error("Incorrect name");

  const isMatch = await bcrypt.compare(user.password, foundUser.hash);
  if (!isMatch) throw new Error("Incorrect hash");

  const accessToken = jwt.sign({ id: foundUser._id }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ id: foundUser._id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  foundUser.refreshToken = refreshToken;
  await foundUser.save();

  return { accessToken, user: foundUser.toObject(), refreshToken };
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
    await UserModel.findByIdAndDelete(id);
  } catch (error: any) {
    throw new Error("Error deleting user: " + error);
  }
}

export async function getUserFromToken(token: string): Promise<UserDocument> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await UserModel.findById(decoded.id);
    if (!user) throw new Error("User not found");
    return user.toObject();
  } catch (err) {
    throw new Error("Invalid token");
  }
}

export async function updateAvatar(
  id: string,
  avatar: string
): Promise<UserDocument | null> {
  try {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { avatar },
      { new: true }
    );
    console.log("Updating avatar in DB for user:", id);
    return user;
  } catch (error: any) {
    throw new Error("Error updating avatar: " + error);
  }
}
