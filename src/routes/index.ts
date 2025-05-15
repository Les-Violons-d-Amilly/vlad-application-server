import { Router } from "express";
import { useAuthentication } from "../utils/authentication";

import auth from "./auth";
import students from "./students";
import teachers from "./teachers";
import schools from "./schools";
import levelResults from "./levelResults";
import contact from "./contact";

const router = Router();

router.use("/auth", auth);
router.use("/schools", schools);
router.use("/students", useAuthentication, students);
router.use("/teachers", useAuthentication, teachers);
router.use("/levelResults", useAuthentication, levelResults);
router.use("/contact", useAuthentication, contact);

export default router;
