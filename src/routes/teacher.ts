import express from "express";
const router = express.Router();
const teacherModel = require("../model/teacherModel");

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
  res.send(res.teacher.name);
  //problem with the res.teacher.name, Property 'teacher' does not exist on type
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
router.patch("/:id", async (req, res) => {});

// deleting a teacher
router.delete("/:id", async (req, res) => {});

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
