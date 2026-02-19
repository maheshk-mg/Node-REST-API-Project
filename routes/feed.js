import express from "express";
import { body } from "express-validator";

import * as feedController from "../controllers/feed.js";
import upload from "../middleware/upload.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();

// GET  /feed
router.get("/posts", isAuth, feedController.getPosts);

// GET POST by ID
router.get("/post/:postId", isAuth, feedController.getPostById);

//POST /feed/post
router.post(
  "/post",
  isAuth,
  upload.single("image"),
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost,
);

// PUT by ID
router.put(
  "/post/:postId",
  isAuth,
  upload.single("image"),
  [
    body("title").optional().trim().isLength({ min: 5 }),
    body("content").optional().trim().isLength({ min: 5 }),
  ],
  feedController.updatePost,
);

//PATCH Post Mark By ID
router.patch("/posts/update-mark", isAuth, feedController.updatePostMark);

//DELETE by ID
router.delete("/post/:postId", isAuth, feedController.deletPost);

// DELETE by Many IDS
router.delete("/posts", isAuth, feedController.deleteManyPosts);

export default router;
