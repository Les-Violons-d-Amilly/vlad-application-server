import { Request, Response, Router } from "express";
import {
  getStudentById,
  login,
  registerUser,
  registerTeacher,
  getTeacherById,
} from "../service/user";
import omit from "../utils/omit";
import jwt from "jsonwebtoken";
import { DecodedToken, useAuthentication } from "../utils/authentication";
import { validateBody } from "../utils/joiValidation";
import {
  studentRegisterSchema,
  teacherRegisterSchema,
} from "../validation/authSchemas";

const router = Router();

router.post(
  "/register/student",
  validateBody(studentRegisterSchema),
  async (req: Request, res: Response): Promise<any> => {
    try {
      await registerUser(req.body);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "" + error });
    }
  }
);

router.post(
  "/register/teacher",
  validateBody(teacherRegisterSchema),
  async (req: Request, res: Response): Promise<any> => {
    try {
      await registerTeacher(req.body);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "" + error });
    }
  }
);

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { accessToken, user, type, refreshToken } = await login(req.body);

    res.status(200).json({
      user: omit(user, "hash", "refreshToken"),
      type,
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

    const users = await Promise.all([
      getStudentById(decoded.id),
      getTeacherById(decoded.id),
    ]);

    const user = users[0] ?? users[1];

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
