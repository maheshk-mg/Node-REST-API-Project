import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/auth.js";
import User from "../models/user.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

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
            return Promise.reject("E-mail address already exists!");
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
  asyncHandler(authController.signupHandler),
);

router.post("/login", authRateLimiter, asyncHandler(authController.loginHandler));

router.post("/logout", asyncHandler(authController.logoutHandler));

router.post("/forget-password", authRateLimiter, asyncHandler(authController.forgetPassword));

router.post("/reset-password/:token", asyncHandler(authController.resetPassword));

export default router;
