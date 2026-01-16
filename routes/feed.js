const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// GET  /feed
router.get("/posts", isAuth, feedController.getPosts);

//POST /feed/post
router.post(
  "/post",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

// GET POST by ID
router.get("/post/:postId", feedController.getPostById);

// PUT by ID
router.put(
  "/post/:postId",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

//PATCH Post Mark By ID
router.patch("/posts/update-mark", feedController.updatePostMark);

//DELETE by ID
router.delete("/post/:postId", feedController.deletPost);

// DELETE by Many IDS
router.delete("/posts", feedController.deleteManyPosts);

module.exports = router;
