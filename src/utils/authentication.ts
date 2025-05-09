import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getStudentById, getTeacherById } from "../service/user";
import UserDocument from "../model/User";

export enum PermissionLevel {
  Student = 0,
  Teacher = 1,
  Admin = 2,
}

export type DecodedToken = {
  id: string;
  permissionLevel: PermissionLevel;
};

export const useAuthentication: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const users = await Promise.all([
      getStudentById(decoded.id),
      getTeacherById(decoded.id),
    ]);

    const user = users[0] ?? users[1];

    if (!user) {
      res.sendStatus(403);
      return;
    }

    req.user = user;
    req.permissionLevel = decoded.permissionLevel;

    next();
  } catch (error) {
    res.sendStatus(403);
  }
};
