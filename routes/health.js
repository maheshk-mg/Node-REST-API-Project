import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * GET /health - Liveness: is the process running?
 */
router.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * GET /health/ready - Readiness: can the app accept traffic (e.g. DB connected)?
 */
router.get("/ready", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "unavailable",
        reason: "Database not connected",
      });
    }
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({
      status: "unavailable",
      reason: err.message || "Health check failed",
    });
  }
});

export default router;
