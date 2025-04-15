import { Request, Response } from "express";

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
