import express from "express";
import { body } from "express-validator";
import isAuth from "../middleware/is-auth.js";
import * as userController from "../controllers/profile.js";
import { uploadProfileImage } from "../middleware/upload.js";

const router = express.Router();

const updateProfileValidators = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Invalid name"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage("Invalid phone"),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Invalid location"),
  body("dob").optional().trim().notEmpty().withMessage("Invalid dob"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio too long"),
  body("status").optional().trim().notEmpty().withMessage("Invalid status"),
];

router.get("/", isAuth, userController.getProfile);

router.put(
  "/update/:postId",
  isAuth,
  uploadProfileImage.single("image"),
  updateProfileValidators,
  userController.updateProfile,
);


router.delete("/delete", isAuth, userController.deleteProfile);

export default router;
