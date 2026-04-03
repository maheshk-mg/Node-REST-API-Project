import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  // Expected format: "Authorization: Bearer <token>"
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  const token = match[1];

  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.statusCode = 500;
    return next(error);
  }
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  req.userId = decodedToken.userId;
  next();
};
