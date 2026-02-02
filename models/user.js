const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "I am new!",
  },

  profileImage: { type: String, default: null },
  profileImagePublicId: { type: String, default: null },
  bio: { type: String, default: "" },
  phone: { type: String, default: null },
  location: { type: String, default: "" },
  dob: { type: String, default: null },

  post: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],

  resetPasswordToken: {
    type: String,
    default: null,
  },

  resetPasswordExpire: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
