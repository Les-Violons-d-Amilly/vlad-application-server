import express from "express";
import dotenv from "dotenv";
import teacherRouter from "./routes/TeacherRoutes";
import exerciseRouter from "./routes/ExerciseRoutes";
import studentRouter from "./routes/StudentRoutes";

const mongoose = require("mongoose");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});

const app = express();

const PORT = process.env.PORT;

app.use(express.json());

app.use("/teacher", teacherRouter);
app.use("/exercise", exerciseRouter);
app.use("/student", studentRouter);

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
