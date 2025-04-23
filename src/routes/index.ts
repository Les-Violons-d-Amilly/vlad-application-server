import { Router } from "express";

import auth from "./auth";
import user from "./user";
import exercise from "./exercise";
import { useAuthentication } from "../utils/authentication";

const router = Router();

router.use("/auth", auth);
router.use("/user", useAuthentication, user);
router.use("/exercise", useAuthentication, exercise);

export default router;
