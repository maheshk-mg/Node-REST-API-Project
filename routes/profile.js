import express from "express";
import isAuth from "../middleware/is-auth.js";
import * as userController from "../controllers/profile.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", isAuth, asyncHandler(userController.getProfile));

export default router;