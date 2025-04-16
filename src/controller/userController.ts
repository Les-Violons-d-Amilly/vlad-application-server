import { Request, Response } from "express";
import { CustomRequest } from "../authMiddleware";
import * as userService from "../service/userService";

export async function registerOne(req: Request, res: Response) {
  try {
    const user = req.body;
    await userService.register(user);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

export async function loginOne(req: Request, res: Response) {
  try {
    const user = req.body;
    const { token } = await userService.login(user);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

export async function deleteOne(req: CustomRequest, res: Response) {
  try {
    const id = req.user?.id;
    if (!id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    await userService.deleteOne(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1]; // Authorization: Bearer <token>
    const user = await userService.getUserFromToken(token);

    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
  return;
}
