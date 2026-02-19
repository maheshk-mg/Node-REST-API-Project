import { validationResult } from "express-validator";
import Post from "../models/post.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

//GET ALL POST
export const getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Posts Fetched successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//GET POST BY ID
export const getPostById = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched by Id", post: post });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//CREATE POST
export const createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Entered data is Incorrect.");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 442;
    throw error;
  }
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imageUrl: req.file.path,
    imagePublicId: req.file.filename,
    creator: req.userId,
    isPostMark: req.body.isPostMark ? req.body.isPostMark : false,
  });

  await post.save();
  const user = await User.findById(req.userId);
  user.post.push(post);
  await user.save();

  res.status(201).json({
    message: "Post created successfully",
    post,
    creator: { _id: user._id, name: user.name },
  });
};

// UPDATE POST BY ID
export const updatePost = async (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Entered data is Incorrect.");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not Authorized");
      error.statusCode = 403;
      throw error;
    }

    if (req.body.title) post.title = req.body.title;
    if (req.body.content) post.content = req.body.content;

    if (req.file) {
      // delete old image from cloudinary
      if (post.imagePublicId) {
        await cloudinary.uploader.destroy(post.imagePublicId);
      }

      post.imageUrl = req.file.path;
      post.imagePublicId = req.file.filename;
    }

    const result = await post.save();

    res.status(200).json({
      message: "Post updated successfully",
      post: result,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// UPDATE Post Mark by ID
export const updatePostMark = async (req, res, next) => {
  const { postIds, isPostMark } = req.body;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: "Post ID must send in an array" });
  }

  if (typeof isPostMark !== "boolean") {
    return res.status(400).json({
      message: "isPostMark must be boolean (true/false)",
    });
  }

  try {
    await Post.updateMany({ _id: { $in: postIds } }, { $set: { isPostMark } });
    res.status(201).json({
      message: "Post Marked Successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//DELETE POST BY ID
export const deletPost = async (req, res, next) => {
  const postId = req.params.postId;

  const post = await Post.findById(postId);

  try {
    if (!post) {
      const error = new Error("Could not find post..");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not Authorized");
      error.statusCode = 403;
      throw error;
    }

    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    await Post.deleteOne({ _id: postId });

    const user = await User.findById(req.userId);
    user.post.pull(postId);
    await user.save();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//DELETE POST by IDS Array
export const deleteManyPosts = async (req, res, next) => {
  const postIds = req.body.postIds;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: "Post ID must send in an array" });
  }

  const posts = await Post.find({ _id: { $in: postIds } });

  try {
    for (const post of posts) {
      if (post.imagePublicId) {
        await cloudinary.uploader.destroy(post.imagePublicId);
      }
    }

    await Post.deleteMany({ _id: { $in: postIds } });

    res.status(200).json({ message: "Select Posts deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
