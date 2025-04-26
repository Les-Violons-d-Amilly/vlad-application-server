import "dotenv/config";
import Student, { StudentDocument } from "../model/Student";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Teacher from "../model/Teacher";
import UserDocument, { Sex } from "../model/User";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PSWD,
  },
});

type RegisterProps = Readonly<{
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  sex: Sex;
  age: number;
  group: string;
  sendMail: boolean;
}>;

type LoginProps = Readonly<{
  identity: string;
  password: string;
}>;

type Type = "student" | "teacher";

export async function registerUser(payload: RegisterProps): Promise<void> {
  let identity =
    payload.firstName[0].toLowerCase() +
    payload.lastName
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 7);

  const existingIdentities = await Student.countDocuments({
    identity: { $regex: new RegExp(`^${identity}\\d*$`) },
  });

  if (existingIdentities) identity += existingIdentities + 1;

  const user = await Student.create({
    firstName: payload.firstName.toLowerCase(),
    lastName: payload.lastName.toLowerCase(),
    identity: identity,
    hash: payload.password,
    email: payload.email,
    sex: payload.sex,
    age: payload.age,
    group: payload.group,
  });

  if (!payload.sendMail) return;

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  user.refreshToken = refreshToken;
  await user.save();

  const mailHTMLBody = /* html */ `
    <h2>Bonjour <b>${payload.firstName}</b></h2>
    <p>Vous avez été inscrit à l'application VLAD.</p>
    <h3>Voici vos identifiants de connexion:</h3>
    <p>Identifiant: <b>${identity}</b><br>
    <p>Mot de passe: <b>${payload.password}</b></p>
    <p>Connectez-vous à l'application VLAD en cliquant sur le lien ci-dessous:</p>
    <p><a href="http://192.168.1.108:8080/auth/redirect?user_id=${user.id}&refreshToken=${refreshToken}&accessToken=${accessToken}">Se Connecter</a></p>`;

  const mailTextBody = mailHTMLBody.replace(/<[^>]+>/g, "");

  const mailOptions = {
    from: `VLADnoreply <${process.env.EMAIL_USER}>`,
    to: payload.email,
    subject: "Identifiant VLAD",
    text: mailTextBody,
    html: mailHTMLBody,
  };

  try {
    await transporter.sendMail(mailOptions);
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
  user: UserDocument;
  type: Type;
  accessToken: string;
  refreshToken: string;
}> {
  let foundUser = await Student.findOne({ identity: user.identity });
  let type: Type = "student";

  if (!foundUser) {
    foundUser = await Teacher.findOne({ identity: user.identity });
    type = "teacher";
  }

  if (!foundUser) throw new Error("Incorrect name");

  const isMatch = await bcrypt.compare(user.password, foundUser.hash);
  if (!isMatch) throw new Error("Incorrect hash");

  const accessToken = jwt.sign({ id: foundUser._id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign(
    { id: foundUser._id },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  foundUser.refreshToken = refreshToken;
  await foundUser.save();

  return { user: foundUser.toObject(), type, accessToken, refreshToken };
}

export async function getStudentById(
  id: string
): Promise<StudentDocument | null> {
  try {
    const user = await Student.findById(id);
    return user;
  } catch (error: any) {
    throw new Error("Error fetching user by ID: " + error);
  }
}

export async function getTeacherById(id: string): Promise<UserDocument | null> {
  try {
    const user = await Teacher.findById(id);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const user = await Student.findById(decoded.id);
    if (!user) throw new Error("User not found");
    return user.toObject();
  } catch (err) {
    throw new Error("Invalid token");
  }
}
