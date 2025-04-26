import express, { Router } from "express";
import path from "path";
import Student from "../model/Student";
import capitalize from "../utils/capitalize";
import { compileAsync } from "sass";
import fs from "fs";

const router = Router();

router.use(express.text());

router.get("/redirect", async (req, res) => {
  const { user_id, refreshToken, accessToken } = req.query;
  const student = await Student.findById(user_id);
  const onMobile = req.headers["user-agent"]?.includes("Mobile") ?? false;

  if (!student) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.render(path.join(__dirname, "../../public/pages/auth.ejs"), {
    user: {
      ...student.toJSON(),
      firstName: capitalize(student.firstName),
      lastName: capitalize(student.lastName),
    },
    refreshToken,
    accessToken,
    onMobile,
  });
});

fs.readdirSync(path.join(__dirname, "../../public/styles")).forEach((file) => {
  router.get(`/styles/${file.replace(/\.scss$/, ".css")}`, async (req, res) => {
    const scssPath = path.join(__dirname, "../../public/styles", file);

    const scss = await compileAsync(scssPath, {
      style: "compressed",
    });

    res.setHeader("Content-Type", "text/css");
    res.send(scss.css.toString());
  });
});

fs.readdirSync(path.join(__dirname, "../../public/scripts")).forEach((file) => {
  router.get(`/scripts/${file}`, async (req, res) => {
    const jsPath = path.join(__dirname, "../../public/scripts", file);
    const js = fs.readFileSync(jsPath, "utf-8");
    res.setHeader("Content-Type", "application/javascript");
    res.send(js);
  });
});

export default router;
