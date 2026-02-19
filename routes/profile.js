import express from "express";
import isAuth from "../middleware/is-auth.js";
import * as userController from "../controllers/profile.js";

const router = express.Router();

router.get("/", isAuth, userController.getProfile);

export default router;