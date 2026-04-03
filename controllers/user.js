import User from "../models/user.js";

export const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({ role: "user" }, "email name role");
  } catch (err) {
    return next(err);
  }

  res.json({ users: users });
};


 