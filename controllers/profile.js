const User = require("../models/user");
const cloudinary = require("../config/cloudinary");

// get profile data

exports.getProfile = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select( "name email phone location dob bio profileImage profileImagePublicId status createdAt updatedAt");
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
