import "dotenv/config";
import Student, { StudentDocument } from "../model/Student";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Teacher from "../model/Teacher";
import UserDocument from "../model/User";
import capitalize from "../utils/capitalize";
import { ParsedStudent, ParsedTeacher } from "../utils/parseCsv";
import sendEmail from "../utils/sendEmail";

type LoginProps = Readonly<{
  identity: string;
  password: string;
}>;

type Type = "student" | "teacher";

export async function registerUser(payload: ParsedStudent) {
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
    birthdate: payload.birthdate,
    group: payload.group,
  });

  if (!payload.sendMail) return user.id;

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  user.refreshToken = refreshToken;
  await user.save();

  try {
    await sendEmail(
      payload.email,
      "Identifiant VLAD",
      /* html */ `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #2c3e50;">Bienvenue, <b>${capitalize(
          payload.firstName
        )}</b> !</h2>
        <p style="font-size: 16px; color: #555;">
          Nous sommes ravis de vous accueillir sur <b>l'application VLAD</b> !
        </p>
        <h3 style="color: #2c3e50; margin-top: 30px;">🔑 Vos identifiants de connexion :</h3>
        <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p style="font-size: 16px; color: #555; margin: 5px 0;">
            <b>Identifiant :</b> ${identity}
          </p>
          <p style="font-size: 16px; color: #555; margin: 5px 0;">
            <b>Mot de passe :</b> ${payload.password}
          </p>
        </div>
        <p style="font-size: 16px; color: #555;">
          <b>Note :</b> Ne partagez jamais vos identifiants avec qui que ce soit. Si vous avez des doutes sur la sécurité de votre compte, n'hésitez pas à changer votre mot de passe.
        </p>
        <p style="font-size: 16px; color: #555;">
          Vous pouvez dès maintenant vous connecter à votre compte en cliquant sur le bouton ci-dessous :
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="http://192.168.1.108:8080/auth/redirect?user_id=${
            user.id
          }&refreshToken=${refreshToken}&accessToken=${accessToken}"
              style="font-size: 18px; color: white; background-color: #4CAF50; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">
            🚀 Se connecter
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
        <p style="font-size: 14px; color: #999; text-align: center;">
          Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.<br>
          Merci de votre confiance et à très bientôt sur <b>VLAD</b> !
        </p>
      </div>
      `
    );
  } catch (error) {
    console.error("error while sending email:", error);
  }

  return user.id;
}

export async function registerTeacher(payload: ParsedTeacher) {
  let identity =
    payload.firstName[0].toLowerCase() +
    payload.lastName
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 7);

  const existingIdentities = await Teacher.countDocuments({
    identity: { $regex: new RegExp(`^${identity}\\d*$`) },
  });

  if (existingIdentities) identity += existingIdentities + 1;

  const teacher = await Teacher.create({
    firstName: payload.firstName.toLowerCase(),
    lastName: payload.lastName.toLowerCase(),
    identity: identity,
    hash: payload.password,
    email: payload.email,
    sex: payload.sex,
  });

  if (!payload.sendMail) return teacher.id;

  try {
    await sendEmail(
      payload.email,
      "Identifiant VLAD",
      /* html */ `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #2c3e50;">Bienvenue, <b>${capitalize(
          payload.firstName
        )}</b> !</h2>
        <p style="font-size: 16px; color: #555;">
          Nous sommes ravis de vous accueillir sur <b>l'application VLAD</b> !
        </p>
        <h3 style="color: #2c3e50; margin-top: 30px;">🔑 Vos identifiants de connexion :</h3>
        <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p style="font-size: 16px; color: #555; margin: 5px 0;">
            <b>Identifiant :</b> ${identity}
          </p>
          <p style="font-size: 16px; color: #555; margin: 5px 0;">
            <b>Mot de passe :</b> ${payload.password}
          </p>
        </div>
        <p style="font-size: 16px; color: #555;">
          <b>Note :</b> Ne partagez jamais vos identifiants avec qui que ce soit. Si vous avez des doutes sur la sécurité de votre compte, n'hésitez pas à changer votre mot de passe.
        </p>
      </div>
      `
    );
  } catch (error) {
    console.error("error while sending email:", error);
  }

  return teacher.id;
}

export async function registerManyUsers(
  users: ParsedStudent[]
): Promise<string[]> {
  const userPromises = users.map((user) => registerUser(user));
  return Promise.all(userPromises);
}

export async function registerManyTeachers(
  users: ParsedTeacher[]
): Promise<string[]> {
  const userPromises = users.map((user) => registerTeacher(user));
  return Promise.all(userPromises);
}

export async function login(user: LoginProps): Promise<{
  user: UserDocument;
  type: Type;
  accessToken: string;
  refreshToken: string;
}> {
  let foundUser = await Student.findOne({ identity: { $eq: user.identity } });
  let type: Type = "student";

  if (!foundUser) {
    foundUser = await Teacher.findOne({ identity: { $eq: user.identity } });
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
