import express from "express";
import * as userController from "../controller/userController";
import { authenticateToken } from "../authMiddleware";
const router = express.Router();

router.post("/register", userController.registerOne);

router.post("/login", userController.loginOne);
//router.put("/@me/avatar", authenticateToken, userController.updateAvatar);
router.get("/@me", authenticateToken, userController.getSelf);
router.delete("/@me", authenticateToken, userController.deleteOne);

router.get("/:id", authenticateToken, userController.getById);

export default router;
