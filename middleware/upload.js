import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
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
});

export default multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
