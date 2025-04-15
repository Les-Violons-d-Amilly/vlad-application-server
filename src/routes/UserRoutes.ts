import express from "express";
import * as userController from "../controller/userController";

const router = express.Router();

router.post("/register", userController.registerOne);
router.post("/login", userController.loginOne);

export default router;
