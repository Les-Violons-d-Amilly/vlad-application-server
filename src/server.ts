import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import auth from "./auth";
import swaggerDocsMiddleware from "./swagger";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import webSocket from "./webSocket";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/VLAD-db";

mongoose.connect(uri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully to " + uri);
});

const app = express();

app.set("view engine", "ejs");

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use("/avatars", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);
app.use("/auth", auth);

const server = app.listen(process.env.PORT, () => {
  console.log("Server running at PORT:", process.env.PORT);
  swaggerDocsMiddleware(app, process.env.PORT || "3000");
  webSocket(server);
});

server.on("error", (error) => {
  console.error(error.message);
});
