import { Request, Response, Router } from "express";
import { getById, login, register } from "../service/user";
import omit from "../utils/omit";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { CustomRequest, useAuthentication } from "../utils/authentication";

const router = Router();

type DecodedToken = {
  id: string;
};

router.post("/register", async (req: Request, res: Response): Promise<any> => {
  const { error, value } = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .max(64)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
      .required(),
    sex: Joi.number().min(0).max(1).required(),
    age: Joi.number().required(),
  }).validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    await register(value);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "" + error });
  }
});

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
    const id = (req as CustomRequest).user?.id;
    if (!id) return res.sendStatus(401);

    const user = await getById(id);
    if (!user) return res.sendStatus(404);

    user.refreshToken = undefined;
    await user.save();

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

    res.status(200).json({ accessToken });
  } catch (error) {
    res.sendStatus(403);
  }
});

export default router;
