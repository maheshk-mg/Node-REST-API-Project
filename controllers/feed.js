import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Post from "../models/post.js";
import User from "../models/user.js";
import Comment from "../models/comment.js";
import Like from "../models/like.js";
import cloudinary from "../config/cloudinary.js";

//GET ALL POST
export const getPosts = async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const rawLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 50)
    : 10;

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q && q.length > 100) {
    return res.status(400).json({ message: "Query `q` is too long" });
  }

  // Sorting is intentionally limited to keep query plans predictable.
  const sortBy =
    req.query.sortBy === "createdAt" || req.query.sortBy === undefined
      ? "createdAt"
      : "createdAt";
  const sortDir = req.query.sort === "oldest" ? 1 : -1;

  try {
    const filter = {};
    if (q) {
      // Search title OR content (case-insensitive).
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
      ];
    }

    const totalItems = await Post.countDocuments(filter);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    const posts = await Post.find(filter)
      .sort({ [sortBy]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("creator", "name profileImage")
      .lean();

    const postIds = posts.map((p) => p._id);

    // Bulk counts to avoid N+1 queries.
    const [likeCounts, commentCounts, likedByUser] = await Promise.all([
      Like.aggregate([
        { $match: { postId: { $in: postIds } } },
        { $group: { _id: "$postId", count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { postId: { $in: postIds } } },
        { $group: { _id: "$postId", count: { $sum: 1 } } },
      ]),
      Like.find({ postId: { $in: postIds }, creator: req.userId })
        .select("postId")
        .lean(),
    ]);

    const likeCountMap = new Map(
      likeCounts.map((d) => [String(d._id), d.count]),
    );
    const commentCountMap = new Map(
      commentCounts.map((d) => [String(d._id), d.count]),
    );
    const likedSet = new Set(likedByUser.map((d) => String(d.postId)));

    const enrichedPosts = posts.map((p) => {
      const id = String(p._id);
      return {
        ...p,
        likeCount: likeCountMap.get(id) || 0,
        commentCount: commentCountMap.get(id) || 0,
        isLiked: likedSet.has(id),
      };
    });

    res.status(200).json({
      message: "Posts Fetched successfully",
      posts: enrichedPosts,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNext: totalPages > 0 ? page < totalPages : false,
      },
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
    const post = await Post.findById(postId)
      .populate("creator", "name profileImage")
      .lean();
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    const [likeCount, commentCount, isLiked] = await Promise.all([
      Like.countDocuments({ postId }),
      Comment.countDocuments({ postId }),
      Like.exists({ postId, creator: req.userId }),
    ]);

    res.status(200).json({
      message: "Post fetched by Id",
      post: { ...post, likeCount, commentCount, isLiked: Boolean(isLiked) },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Get COMMENTS by ID
export const getCommentsByPostId = async (req, res, next) => {
  const postId = req.params.postId;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  try {
    const totalItems = await Comment.countDocuments({ postId });

    const comments = await Comment.find({ postId })
      .populate("creator", "name profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    res.status(200).json({
      message: "Comments fetched successfully",
      comments,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// CREATE COMMENT
export const createComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Entered data is Incorrect.");
    error.statusCode = 422;
    return next(error);
  }

  const postId = req.params.postId;
  const content =
    typeof req.body.content === "string" ? req.body.content.trim() : "";

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid postId");
      error.statusCode = 400;
      throw error;
    }

    const post = await Post.findById(postId).select("_id");
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    if (content.length < 1) {
      const error = new Error("Comment content cannot be empty");
      error.statusCode = 422;
      throw error;
    }

    const created = await Comment.create({
      postId,
      creator: req.userId,
      content,
    });

    const comment = await Comment.findById(created._id)
      .populate("creator", "name profileImage")
      .lean();

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// GET COMMENTS (paginated)
export const getComments = async (req, res, next) => {
  const { postId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const rawLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 50)
    : 10;

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid postId");
      error.statusCode = 400;
      throw error;
    }

    const totalItems = await Comment.countDocuments({ postId });
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("creator", "name profileImage")
      .lean();

    res.status(200).json({
      message: "Comments fetched successfully",
      comments,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNext: totalPages > 0 ? page < totalPages : false,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// DELETE COMMENT (only the comment author can delete)
export const deleteComment = async (req, res, next) => {
  const { postId, commentId } = req.params;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      const error = new Error("Invalid postId or commentId");
      error.statusCode = 400;
      throw error;
    }

    const comment = await Comment.findOne({
      _id: commentId,
      postId,
      creator: req.userId,
    });

    if (!comment) {
      const error = new Error("Could not find comment");
      error.statusCode = 404;
      throw error;
    }

    await Comment.deleteOne({ _id: commentId });
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// TOGGLE LIKE on a post
export const toggleLike = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid postId");
      error.statusCode = 400;
      throw error;
    }

    const post = await Post.findById(postId).select("_id");
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    const existing = await Like.findOne({ postId, creator: req.userId });

    if (existing) {
      await Like.deleteOne({ _id: existing._id });
      const likeCount = await Like.countDocuments({ postId });
      return res.status(200).json({
        message: "Like removed",
        likeCount,
        isLiked: false,
      });
    }

    await Like.create({ postId, creator: req.userId });
    const likeCount = await Like.countDocuments({ postId });
    return res.status(201).json({
      message: "Post liked",
      likeCount,
      isLiked: true,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// GET LIKE SUMMARY for a post
export const getLikeSummary = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid postId");
      error.statusCode = 400;
      throw error;
    }

    const [likeCount, isLiked] = await Promise.all([
      Like.countDocuments({ postId }),
      Like.exists({ postId, creator: req.userId }),
    ]);

    res.status(200).json({
      likeCount,
      isLiked: Boolean(isLiked),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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
    const uniquePostIds = [...new Set(postIds)];
    const invalidIds = uniquePostIds.filter(
      (id) => typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({ message: "Invalid post IDs provided" });
    }

    const normalizedPostIds = uniquePostIds;

    if (normalizedPostIds.length === 0) {
      return res.status(400).json({ message: "No valid post IDs provided" });
    }

    const result = await Post.updateMany(
      { _id: { $in: normalizedPostIds }, creator: req.userId },
      { $set: { isPostMark } },
    );

    // If any ID belongs to a different user, matchedCount will be smaller.
    if (result.matchedCount !== normalizedPostIds.length) {
      const error = new Error("Not Authorized for one or more posts");
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
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

    // Cleanup associated engagement data for consistency.
    await Comment.deleteMany({ postId });
    await Like.deleteMany({ postId });

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

  try {
    const uniquePostIds = [...new Set(postIds)];
    const invalidIds = uniquePostIds.filter(
      (id) => typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({ message: "Invalid post IDs provided" });
    }

    const normalizedPostIds = uniquePostIds;

    if (normalizedPostIds.length === 0) {
      return res.status(400).json({ message: "No valid post IDs provided" });
    }

    const posts = await Post.find({
      _id: { $in: normalizedPostIds },
      creator: req.userId,
    });

    if (posts.length !== normalizedPostIds.length) {
      const error = new Error("Not Authorized for one or more posts");
      error.statusCode = 403;
      throw error;
    }

    for (const post of posts) {
      if (post.imagePublicId) {
        await cloudinary.uploader.destroy(post.imagePublicId);
      }
    }

    // Cleanup associated engagement data for consistency.
    await Comment.deleteMany({ postId: { $in: normalizedPostIds } });
    await Like.deleteMany({ postId: { $in: normalizedPostIds } });

    await Post.deleteMany({
      _id: { $in: normalizedPostIds },
      creator: req.userId,
    });

    res.status(200).json({ message: "Selected Posts deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
