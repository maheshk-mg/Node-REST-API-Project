import express from "express";
import { body } from "express-validator";
import isAdmin from "../middleware/is-admin.js";
import * as userController from "../controllers/user.js";
import * as profileController from "../controllers/profile.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();


router.get("/all-users", isAdmin, userController.getAllUsers);

// router.delete("/user/:id", isAuth, isAdmin, profileController.deleteProfile);
router.delete("/user/:id", isAuth, async (req, res, next) => {
  const targetUserId = req.params.id;
  if (targetUserId !== req.userId && req.role !== "admin") {
    return res.status(403).json({ error: "Not Authorized" });
  }
  req.userId = targetUserId;
  profileController.deleteProfile(req, res, next);
});


export default router;