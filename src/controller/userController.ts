import { Request, Response } from "express";
import { CustomRequest } from "../authMiddleware";
import * as userService from "../service/user";

type PublicUser = Readonly<{
  firstName: string;
  lastName: string;
  avatar: string | null; // Lien local vers le stockage des photos de profil
}>;

type ProtectedUser = PublicUser &
  Readonly<{
    email: string;
    login: string;
  }>;

type User = ProtectedUser &
  Readonly<{
    hash: string;
  }>;

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

export async function getById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const user = await userService.getById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const publicUser: PublicUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    };
    res.status(200).json(publicUser);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

export async function getSelf(req: CustomRequest, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    const token = authHeader.split(" ")[1]; // Authorization: Bearer <token>
    const user = await userService.getUserFromToken(token);
    const protectedUser: ProtectedUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      login: user.login,
      email: user.email,
    };
    res.status(200).json(protectedUser);
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
  return;
}

export async function updateAvatar(req: CustomRequest, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    const token = authHeader.split(" ")[1]; // Authorization: Bearer <token>
    const { avatar } = req.body;
    if (typeof avatar !== "string" || avatar.trim() === "") {
      res.status(400).json({ message: "Invalid avatar format" });
      return;
    }
    const user = await userService.getUserFromToken(token);
    const updatedUser = await userService.updateAvatar(user.id, avatar);
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
  return;
}
