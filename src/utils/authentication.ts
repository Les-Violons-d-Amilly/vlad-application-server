import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getById } from "../service/user";
import { StudentDocument } from "../model/Student";

export enum PermissionLevel {
  Student = 0,
  Teacher = 1,
  Admin = 2,
}

export type CustomRequest = Request & {
  user: StudentDocument;
  permissionLevel: PermissionLevel;
};

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
    const user = await getById(decoded.id);

    if (!user) {
      res.sendStatus(403);
      return;
    }

    (req as CustomRequest).user = user;
    (req as CustomRequest).permissionLevel = decoded.permissionLevel;

    next();
  } catch (error) {
    res.sendStatus(403);
  }
};
