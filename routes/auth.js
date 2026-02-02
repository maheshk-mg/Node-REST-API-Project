const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");

const User = require("../models/user");

const router = express.Router();

// PUT /auth/signin
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

router.post("/login", authController.loginHandler);

router.post("/logout", authController.logoutHandler);

router.post("/forget-password", authController.forgetPassword);

router.post("/reset-password/:token", authController.resetPassword);




module.exports = router;
