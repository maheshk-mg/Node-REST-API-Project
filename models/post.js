import mongoose from "mongoose";
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },

    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isPostMark: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Post", postSchema);
