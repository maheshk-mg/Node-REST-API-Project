import express from "express";
import { body } from "express-validator";
import * as feedController from "../controllers/feed.js";
import { uploadPostImage } from "../middleware/upload.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();

// GET  /feed
router.get("/posts", isAuth, feedController.getPosts);

// GET POST by ID
router.get("/post/:postId", isAuth, feedController.getPostById);

// COMMENTS
router.get("/post/:postId/comments", isAuth, feedController.getComments);
router.post(
  "/post/:postId/comments",
  isAuth,
  [body("content").trim().isLength({ min: 1, max: 500 })],
  feedController.createComment,
);
router.delete(
  "/post/:postId/comments/:commentId",
  isAuth,
  feedController.deleteComment,
);
router.get(
  "/posts/:postId/comments",
  isAuth,
  feedController.getCommentsByPostId,
);

// LIKES
// POST toggles like/unlike for the current user.
router.post("/post/:postId/like", isAuth, feedController.toggleLike);
router.get("/post/:postId/likes", isAuth, feedController.getLikeSummary);

//POST /feed/post
router.post(
  "/post",
  isAuth,
  uploadPostImage.single("image"),
  [
    body("title").trim().isLength({ min: 3 }),
    body("content").trim().isLength({ min: 3 }),
  ],
  feedController.createPost,
);

// PUT by ID
router.put(
  "/post/:postId",
  isAuth,
  uploadPostImage.single("image"),
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
