import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import db from "./config/db.js";
import feedRoutes from "./routes/feed.js";
import authRoutes from "./routes/auth.js";
import profiles from "./routes/profile.js";
import { get404, get500 } from "./controllers/error.js";



const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- FILE UPLOAD CONFIG ---------- */
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + "-" + file.originalname);
//   },
// });

// const fileFiler = (req, file, cb) => {
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/jpeg" ||
//     file.mimetype === "image/webp"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

/* ---------- MIDDLEWARE ---------- */
app.use(express.json());
// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFiler }).single("image"),
// );
// app.use("/images", express.static(path.join(__dirname, "images")));

/* ---------- CORS ---------- */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* ---------- SECURITY & LOGGING ---------- */
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {
    flags: "a",
  },
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

/* ---------- ROUTES ---------- */

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profiles);

/* ---------- OPTIONAL 500 ROUTE ---------- */
app.get("/500", get500);

/* ---------- 404 HANDLER (LAST ROUTE) ---------- */
app.use(get404);

/* ---------- GLOBAL ERROR HANDLER ---------- */
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  console.log(error);
  res.status(status).json({ message, data });
});

/* ---------- DB CONNECTION ---------- */
db()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
  });
