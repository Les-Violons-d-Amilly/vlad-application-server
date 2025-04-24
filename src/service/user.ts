import Student, { StudentDocument } from "../model/Student";
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Teacher from "../model/Teacher";
import UserDocument from "../model/User";

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
  group: string;
}>;

type LoginProps = Readonly<{
  identity: string;
  password: string;
}>;

export async function registerUser(user: RegisterProps): Promise<void> {
  let identity =
    user.firstName[0].toLowerCase() +
    user.lastName
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 7);

  const existingIdentities = await Student.countDocuments({
    identity: { $regex: new RegExp(`^${identity}\\d*$`) },
  });

  if (existingIdentities) identity += existingIdentities + 1;

  await Student.create({
    firstName: user.firstName.toLowerCase(),
    lastName: user.lastName.toLowerCase(),
    identity: identity,
    hash: user.password,
    email: user.email,
    sex: user.sex,
    age: user.age,
    group: user.group,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PSWD,
    },
  });

  const mailOptions = {
    from: " Vladnoreply <${process.env.EMAIL_USER>",
    to: user.email,
    subject: "TEST VLAD BACKEND NODMAILER",
    text: "Bonjour ${firstName}, bienvenue !",
    html: "<b>Voici ton login: </b>",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("error while sending email:", error);
  }
}

export async function registerTeacher(user: RegisterProps): Promise<void> {
  let identity =
    user.firstName[0].toLowerCase() +
    user.lastName
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 7);

  const existingIdentities = await Teacher.countDocuments({
    identity: { $regex: new RegExp(`^${identity}\\d*$`) },
  });

  if (existingIdentities) identity += existingIdentities + 1;

  await Teacher.create({
    firstName: user.firstName.toLowerCase(),
    lastName: user.lastName.toLowerCase(),
    identity: identity,
    hash: user.password,
    email: user.email,
    sex: user.sex,
  });
}

export async function registerManyUsers(
  users: RegisterProps[]
): Promise<number> {
  const userPromises = users.map((user) => registerUser(user));
  await Promise.all(userPromises);
  return users.length;
}

export async function registerManyTeachers(
  users: RegisterProps[]
): Promise<number> {
  const userPromises = users.map((user) => registerTeacher(user));
  await Promise.all(userPromises);
  return users.length;
}

export async function login(user: LoginProps): Promise<{
  accessToken: string;
  user: UserDocument;
  refreshToken: string;
}> {
  let foundUser = await Student.findOne({ identity: user.identity });
  foundUser ??= await Teacher.findOne({ identity: user.identity });
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

  return { user: foundUser.toObject(), accessToken, refreshToken };
}

export async function getById(id: string): Promise<StudentDocument | null> {
  try {
    const user = await Student.findById(id);
    return user;
  } catch (error: any) {
    throw new Error("Error fetching user by ID: " + error);
  }
}

export async function deleteOne(id: string): Promise<void> {
  try {
    await Student.findByIdAndDelete(id);
  } catch (error: any) {
    throw new Error("Error deleting user: " + error);
  }
}

export async function getUserFromToken(
  token: string
): Promise<StudentDocument> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await Student.findById(decoded.id);
    if (!user) throw new Error("User not found");
    return user.toObject();
  } catch (err) {
    throw new Error("Invalid token");
  }
}
