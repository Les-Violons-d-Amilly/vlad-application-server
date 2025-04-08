import express from "express";
import dotenv from "dotenv";

dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});
const app = express();

const PORT = process.env.PORT;

app.use(express.json());

const teacherRouter = require("./routes/teacher");

app.use("/teacher", teacherRouter);

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
