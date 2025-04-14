import dotenv from "dotenv";

dotenv.config();

import { Socket } from "socket.io";
const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
import express from "express";

import teacherRouter from "./routes/TeacherRoutes";
import exerciseRouter from "./routes/ExerciseRoutes";
import studentRouter from "./routes/StudentRoutes";
import groupRouter from "./routes/GroupRoutes";

const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/VLAD-db";

mongoose.connect(uri);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully to " + uri);
});

io.on("connection", (socket: Socket) => {
  console.log("A user connected: " + socket.id); // Log the socket ID of the connected user
});

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/teacher", teacherRouter);
app.use("/exercise", exerciseRouter);
app.use("/student", studentRouter);
app.use("/group", groupRouter);

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
