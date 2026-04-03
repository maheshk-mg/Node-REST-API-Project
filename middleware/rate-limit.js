import rateLimit from "express-rate-limit";

function parseMs(value, fallbackMs) {
  if (value == null || value === "") return fallbackMs;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallbackMs;
}

function parseIntSafe(value, fallback) {
  if (value == null || value === "") return fallback;
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function rateLimitHandler(req, res) {
  const retryAfterSec = Number.parseInt(String(res.getHeader("Retry-After") ?? ""), 10);
  const retryAfter = Number.isFinite(retryAfterSec) ? retryAfterSec : undefined;

  res.status(429).json({
    message: "Too many requests, please try again later.",
    ...(retryAfter ? { retryAfterSeconds: retryAfter } : {}),
  });
}

function keyGenerator(req) {
  // With `app.set('trust proxy', ...)`, Express will populate req.ip correctly.
  return req.ip;
}

export const apiLimiter = rateLimit({
  windowMs: parseMs(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  limit: parseIntSafe(process.env.RATE_LIMIT_MAX, 300), // default: 300 req / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
});

export const authLimiter = rateLimit({
  windowMs: parseMs(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  limit: parseIntSafe(process.env.AUTH_RATE_LIMIT_MAX, 30), // default: 30 req / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
});

export const passwordResetLimiter = rateLimit({
  windowMs: parseMs(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
  limit: parseIntSafe(process.env.PASSWORD_RESET_RATE_LIMIT_MAX, 10), // default: 10 req / hour / IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
});

