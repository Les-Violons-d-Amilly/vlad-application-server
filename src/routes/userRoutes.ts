import express from "express";
import * as userController from "../controller/userController";
import { authenticateToken } from "../authMiddleware";
const router = express.Router();

router.post("/register", userController.registerOne);

router.post("/login", userController.loginOne);

router.delete("/me", authenticateToken, userController.deleteOne);

router.get("/me", authenticateToken, userController.getProfile);

export default router;
