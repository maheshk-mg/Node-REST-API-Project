/**
 * Rejects requests that do not have multipart/form-data content-type.
 * Use before multer so invalid body types are rejected without touching file upload.
 */
export default (req, res, next) => {
  const contentType = req.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) {
    const error = new Error("Content-Type must be multipart/form-data for this endpoint");
    error.statusCode = 422;
    return next(error);
  }
  next();
};
