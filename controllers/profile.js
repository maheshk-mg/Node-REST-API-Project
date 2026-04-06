import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import Like from "../models/like.js";
import cloudinary from "../config/cloudinary.js";
import { validationResult } from "express-validator";

// get profile data
export const getProfile = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select(
      "name email phone location dob bio profileImage profileImagePublicId status createdAt updatedAt",
    );
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ user });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//update profile data
export const updateProfile = async (req, res, next) => {
  const userId = req.userId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, Entered data is Incorrect.");
    error.statusCode = 422;
    throw error;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({
        email: req.body.email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename);
        }
        const error = new Error("Email already in use");
        error.statusCode = 422;
        throw error;
      }
    }

    if (req.body.status) user.status = req.body.status;
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.location) user.location = req.body.location;
    if (req.body.dob) user.dob = req.body.dob;
    if (req.body.bio) user.bio = req.body.bio;

    if (req.file) {
      // delete old profile image from cloudinary
      if (user.profileImagePublicId) {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      }

      user.profileImage = req.file.path;
      user.profileImagePublicId = req.file.filename;
    }

    const result = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// delete profile
export const deleteProfile = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // delete profile image from cloudinary
    if (user.profileImagePublicId) {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    }

    // Clean up the user's posts + their Cloudinary images
    const posts = await Post.find({ creator: userId });
    for (const post of posts) {
      if (post.imagePublicId) {
        await cloudinary.uploader.destroy(post.imagePublicId);
      }
    }

    const postIds = posts.map((p) => p._id);
    // Cleanup associated engagement data for consistency.
    await Comment.deleteMany({ postId: { $in: postIds } });
    await Like.deleteMany({ postId: { $in: postIds } });

    // Delete posts first to keep data consistent
    await Post.deleteMany({ creator: userId });
    await User.deleteOne({ _id: userId });

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
