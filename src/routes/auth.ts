import { Request, Response, Router } from "express";
import { getById, login, registerUser, registerTeacher } from "../service/user";
import omit from "../utils/omit";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { DecodedToken, useAuthentication } from "../utils/authentication";

const router = Router();

router.post(
  "/register/student",
  async (req: Request, res: Response): Promise<any> => {
    const { error, value } = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .max(64)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
        .required(),
      sex: Joi.string().valid("male", "female").required(),
      age: Joi.number().required(),
      group: Joi.string().required(),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      await registerUser(value);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "" + error });
    }
  }
);

router.post(
  "/register/teacher",
  async (req: Request, res: Response): Promise<any> => {
    const { error, value } = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .max(64)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
        .required(),
      sex: Joi.string().valid("male", "female").required(),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      await registerTeacher(value);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "" + error });
    }
  }
);

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { accessToken, user, refreshToken } = await login(req.body);

    res.status(200).json({
      user: omit(user, "hash", "refreshToken"),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

router.post("/logout", useAuthentication, async (req, res): Promise<any> => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

router.post("/refresh", async (req: Request, res: Response): Promise<any> => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!
    ) as DecodedToken;

    const user = await getById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.sendStatus(403);
  }
});

export default router;
