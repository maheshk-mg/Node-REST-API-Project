import express from "express";
import { body } from "express-validator";
import isAdmin from "../middleware/is-admin.js";
import * as userController from "../controllers/user.js";
import * as profileController from "../controllers/profile.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();


router.get("/all-users", isAdmin, userController.getAllUsers);

router.delete("/user/:id", isAuth, isAdmin, profileController.deleteProfile);


export default router;