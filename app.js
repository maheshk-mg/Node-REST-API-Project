require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const db = require("./config/db");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");

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



/* ---------- OPTIONAL 500 ROUTE ---------- */
app.get("/500", errorController.get500);

/* ---------- 404 HANDLER (LAST ROUTE) ---------- */
app.use(errorController.get404);

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
  .catch(err => {
    console.error('Failed to connect to the database:', err.message);
  });
