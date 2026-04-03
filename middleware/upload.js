import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const createStorage = (folderName, width, height) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const name = file.originalname
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/\s+/g, "-");

      return {
        folder: folderName,
        public_id: `${Date.now()}-${name}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          {
            width: width,
            height: height,
            crop: "fill",
            gravity: "auto",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      };
    },
  });
};

export const uploadPostImage = multer({
  storage: createStorage("blogFeed_images", 800, 800),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadProfileImage = multer({
  storage: createStorage("blogFeed_profile_images", 500, 500),
  limits: { fileSize: 5 * 1024 * 1024 },
});
