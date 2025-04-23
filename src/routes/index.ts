import { Router } from "express";
import { useAuthentication } from "../utils/authentication";

import auth from "./auth";
import students from "./students";
import teachers from "./teachers";
import exercises from "./exercises";

const router = Router();

router.use("/auth", auth);
router.use("/students", useAuthentication, students);
router.use("/teachers", useAuthentication, teachers);
router.use("/exercises", useAuthentication, exercises);

export default router;
