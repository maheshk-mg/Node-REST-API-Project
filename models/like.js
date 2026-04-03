import mongoose from "mongoose";

const Schema = mongoose.Schema;

const likeSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // User who liked the post
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate likes from the same user for a post
likeSchema.index({ postId: 1, creator: 1 }, { unique: true });
likeSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.model("Like", likeSchema);

