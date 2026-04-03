import express from "express";
import { body, param } from "express-validator";

import * as authController from "../controllers/auth.js";
import User from "../models/user.js";
import { passwordResetLimiter } from "../middleware/rate-limit.js";

const router = express.Router();

// PUT /auth/signup
router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-mail address already exits!");
          }
        });
      })
      .trim()
      .toLowerCase()
      .normalizeEmail({
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
      }),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signupHandler,
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .trim()
      .toLowerCase(),
    body("password").trim().isLength({ min: 5 }).withMessage("Password is too short"),
  ],
  authController.loginHandler,
);

router.post("/logout", authController.logoutHandler);

router.post(
  "/forget-password",
  passwordResetLimiter,
  [body("email").isEmail().withMessage("Please enter a valid email").trim().toLowerCase()],
  authController.forgetPassword,
);

router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  [
    param("token")
      .notEmpty()
      .withMessage("Token is required")
      .isLength({ min: 40, max: 100 })
      .withMessage("Invalid token format"),
    body("newPassword").trim().isLength({ min: 5 }).withMessage("Password is too short"),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match"),
  ],
  authController.resetPassword,
);

export default router;
