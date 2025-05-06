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
  loginSchema,
  newPasswordSchema,
  refreshSchema,
  resetPasswordSchema,
  studentRegisterSchema,
  teacherRegisterSchema,
} from "../validation/authSchemas";
import Student from "../model/Student";

const router = Router();

router.post(
  /**
   * @openapi
   * /api/auth/register/student:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Register a new student
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *               - sex
   *               - birthdate
   *               - group
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               sex:
   *                 type: string
   *                 enum: [male, female]
   *               birthdate:
   *                 type: string
   *                 format: date
   *               group:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
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

router.post(
  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Login a user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - emailOrIdentity
   *               - password
   *             properties:
   *               emailOrIdentity:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       400:
   *         description: Validation error
   */
  "/login",
  validateBody(loginSchema),
  async (req: Request, res: Response) => {
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
  }
);

router.post(
  /**
   * @openapi
   * /api/auth/reset-password:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Request a password reset
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identity
   *             properties:
   *               identity:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password reset token generated
   *       404:
   *         description: User not found
   */
  "/reset-password",
  validateBody(resetPasswordSchema),
  async (req, res) => {
    const user = await Student.findOne({
      $or: [
        { email: req.body.identityOrEmail },
        { _id: req.body.identityOrEmail },
      ],
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "10m",
    });

    res.status(200).json({
      message: "Password reset token generated",
      token,
    });
  }
);

router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    res.status(200).json({ message: "Token is valid", userId: decoded.id });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

router.post(
  "/reset-password/:token",
  validateBody(newPasswordSchema),
  async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as DecodedToken;
      const user = await Student.findById(decoded.id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      user.hash = password;
      user.save();

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid or expired token" });
    }
  }
);

router.post("/logout", useAuthentication, async (req, res): Promise<any> => {
  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Logout a user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User logged out successfully
   *       500:
   *         description: Server error
   */
  try {
    req.user.refreshToken = undefined;
    await req.user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

router.post(
  /**
   * @openapi
   * /api/auth/refresh:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Refresh access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Access token refreshed successfully
   *       401:
   *         description: Unauthorized
   */
  "/refresh",
  validateBody(refreshSchema),
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.sendStatus(401);
      return;
    }

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
        res.sendStatus(403);
        return;
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
  }
);

export default router;
