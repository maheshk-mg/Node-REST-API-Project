import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { cloudinaryIsConfigured } from "../config/cloudinary.js";

const cloudinaryStorage = cloudinaryIsConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        const name = file.originalname
          .split(".")
          .slice(0, -1)
          .join(".")
          .replace(/\s+/g, "-");

        return {
          folder: "blogFeed_images",
          public_id: `${Date.now()}-${name}`,
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [
            {
              width: 800,
              height: 800,
              crop: "fill",
              gravity: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        };
      },
    })
  : null;

const multerUpload = cloudinaryStorage
  ? multer({
      storage: cloudinaryStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  : null;

/** Use this for POST/PUT post. If Cloudinary is not configured, returns 503 with a clear message. */
function singleImage(req, res, next) {
  if (!multerUpload) {
    const err = new Error(
      "Image upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env (see https://cloudinary.com/console)"
    );
    err.statusCode = 503;
    if (typeof next === "function") return next(err);
    return res.status(503).json({ message: err.message });
  }
  multerUpload.single("image")(req, res, next);
}

export default { single: singleImage };
