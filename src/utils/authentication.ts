import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getById } from "../service/user";
import { UserDocument } from "../model/User";

export type CustomRequest = Request & {
  user: UserDocument;
};

export type DecodedToken = {
  id: string;
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
    next();
  } catch (error) {
    res.sendStatus(403);
  }
};
