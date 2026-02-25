import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import feedRoutes from "./routes/feed.js";
import authRoutes from "./routes/auth.js";
import profiles from "./routes/profile.js";
import healthRoutes from "./routes/health.js";
import { get404, get500 } from "./controllers/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(express.json());

/* ---------- CORS ---------- */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : ["*"];

app.use((req, res, next) => {
  const origin = req.get("Origin");
  const allowOrigin = allowedOrigins.includes("*")
    ? "*"
    : origin && allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || "*";
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
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
if (process.env.NODE_ENV !== "test") {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" },
  );
  app.use(morgan("combined", { stream: accessLogStream }));
}

app.use(helmet());
app.use(compression());

const isProduction = process.env.NODE_ENV === "production";
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 1000,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith("/health"),
  }),
);

/* ---------- ROUTES ---------- */
app.use("/health", healthRoutes);
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
  const isProduction = process.env.NODE_ENV === "production";
  const message = status === 500 && isProduction ? "Internal server error" : error.message;
  const data = status !== 500 || !isProduction ? error.data : undefined;
  if (status === 500) {
    console.error(error);
  } else if (process.env.NODE_ENV !== "test") {
    console.warn(`${status} ${error.message}`, data ? { data } : "");
  }
  res.status(status).json({ message, data });
});

export default app;
