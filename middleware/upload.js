const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogFeed_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => {
      const name = file.originalname
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/\s+/g, "-");

      return `${Date.now()}-${name}`;
    },
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});