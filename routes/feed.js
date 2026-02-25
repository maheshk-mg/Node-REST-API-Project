import express from "express";
import { body } from "express-validator";

import * as feedController from "../controllers/feed.js";
import upload from "../middleware/upload.js";
import isAuth from "../middleware/is-auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import requireMultipart from "../middleware/requireMultipart.js";

const router = express.Router();

// GET  /feed
router.get("/posts", isAuth, asyncHandler(feedController.getPosts));

// GET POST by ID
router.get("/post/:postId", isAuth, asyncHandler(feedController.getPostById));

//POST /feed/post (validate content-type before multer, then body after)
router.post(
  "/post",
  isAuth,
  requireMultipart,
  upload.single,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  asyncHandler(feedController.createPost),
);

// PUT by ID
router.put(
  "/post/:postId",
  isAuth,
  requireMultipart,
  upload.single,
  [
    body("title").optional().trim().isLength({ min: 5 }),
    body("content").optional().trim().isLength({ min: 5 }),
  ],
  asyncHandler(feedController.updatePost),
);

//PATCH Post Mark By ID
router.patch("/posts/update-mark", isAuth, asyncHandler(feedController.updatePostMark));

//DELETE by ID
router.delete("/post/:postId", isAuth, asyncHandler(feedController.deletPost));

// DELETE by Many IDS
router.delete("/posts", isAuth, asyncHandler(feedController.deleteManyPosts));

export default router;
