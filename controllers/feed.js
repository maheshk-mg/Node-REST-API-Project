const fs = require("fs");
const path = require("path");

const { check, validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

//GET ALL POST
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
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
exports.getPostById = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched by Id", post: post });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//CREATE POST
exports.createPost = (req, res, next) => {
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

  const image = req.file;
  const imagesUrl = image.path;
  const title = req.body.title;
  const content = req.body.content;
  const isPostmakr = req.body.isPostMark;

  let creator;
  const post = Post({
    title: title,
    content: content,
    imageUrl: imagesUrl,
    creator: req.userId,
    isPostMark: isPostmakr ? isPostmakr : false,
  });

  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.post.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post Created Successfully",
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// UPDATE POST BY ID
exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.imageUrl;

  if (req.file) {
    imageUrl = req.file.path;
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Entered data is Incorrect.");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      if (title) post.title = title;
      if (content) post.content = content;

      if (req.file) {
        clearImage(post.imageUrl);
        post.imageUrl = req.file.path;
      }
      return post.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post Update Successfully",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// UPDATE Post Mark by ID
exports.updatePostMark = (req, res, next) => {
  const { postIds, isPostMark } = req.body;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: "Post ID must send in an array" });
  }

  if (typeof isPostMark !== "boolean") {
    return res.status(400).json({
      message: "isPostMark must be boolean (true/false)",
    });
  }

  Post.updateMany({ _id: { $in: postIds } }, { $set: { isPostMark } })
    .then((result) => {
      res.status(201).json({
        message: "Post Marked Successfully",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//DELETE POST BY ID
exports.deletPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
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

      clearImage(post.imageUrl);
      return Post.deleteOne({ _id: postId });
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.post.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post Delete Successfully!" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//DELETE POST by IDS Array
exports.deleteManyPosts = (req, res, next) => {
  const postIds = req.body.postIds;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: "Post ID must send in an array" });
  }

  Post.find({ _id: { $in: postIds } })
    .then((posts) => {
      posts.forEach((post) => {
        if (!post) {
          const error = new Error("Could not find post..");
          error.statusCode = 404;
          throw error;
        }
        clearImage(post.imageUrl);
      });

      return Post.deleteMany({ _id: { $in: postIds } });
    })
    .then((result) => {
      res.status(200).json({ message: "Posts Delete Successfully!" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//Clear Images
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
