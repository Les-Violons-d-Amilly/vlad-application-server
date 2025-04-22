import dotenv from "dotenv";

dotenv.config();
import express from "express";
import rateLimit from "express-rate-limit";
import userRouter from "./routes/user";
import teacherRouter from "./routes/teacher";
import exerciseRouter from "./routes/exercise";
import studentRouter from "./routes/student";
import groupRouter from "./routes/groupRoutes";
import { authenticateToken } from "./authMiddleware";
import swaggerDocsMiddleware from "./swagger";

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/VLAD-db";

mongoose.connect(uri);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully to " + uri);
});

const app = express();
app.use(limiter); // apply rate limiter to all requests
const PORT = process.env.PORT;

app.use(express.json());

app.use("/user", userRouter);
app.use("/teacher", authenticateToken, teacherRouter);
app.use("/exercise", authenticateToken, exerciseRouter);
app.use("/student", authenticateToken, studentRouter);
app.use("/group", groupRouter);

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);

    swaggerDocsMiddleware(app, PORT || "5000");
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
