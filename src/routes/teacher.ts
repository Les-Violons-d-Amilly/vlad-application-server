import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();
const teacherModel = require("../model/teacherModel");

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter);

// getting all teachers
router.get("/", async (req, res) => {
  try {
    const teachers = await teacherModel.find({});
    res.json(teachers);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// getting a teacher by id
router.get("/:id", getTeacher, async (req, res) => {
  res.json((res as any).teacher);
  //problem with the res.teacher.name, Property 'teacher' does not exist on type
  //(res as any) is a temporary solution.
});

// creating a teacher
router.post("/", async (req, res) => {
  const teacher = new teacherModel({
    name: req.body.name,
    email: req.body.email,
  });
  try {
    const newTeacher = await teacher.save();
    res.status(201).json(newTeacher);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// updating a teacher
router.patch("/:id", getTeacher, async (req, res) => {
  if (req.body.name != null) {
    (res as any).teacher.name = req.body.name;
  }
  if (req.body.email != null) {
    (res as any).teacher.email = req.body.email;
  }
  try {
    const updatedTeacher = await (res as any).teacher.save();
    res.json(updatedTeacher);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// deleting a teacher
router.delete("/:id", getTeacher, async (req, res) => {
  try {
    await (res as any).teacher.deleteOne();
    //(res as any) is a temporary solution.
    res.json({ message: "Deleted teacher" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

async function getTeacher(req: any, res: any, next: any) {
  let teacher;
  try {
    teacher = await teacherModel.findById(req.params.id);
    if (teacher == null) {
      return res.status(404).json({ message: "Cannot find teacher" });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
  res.teacher = teacher;
  next(); // call the next middleware function
}

module.exports = router;
