import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

export interface CustomRequest extends Request {
  user?: any;
}

export const authenticateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void | Promise<void> => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.sendStatus(403);
  }
};
