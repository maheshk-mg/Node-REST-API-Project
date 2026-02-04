
const express = require("express");
// const upload = require("../middleware/upload");
const isAuth = require("../middleware/is-auth");

const userController = require("../controllers/profile");
const router = express.Router();

router.get("/", isAuth, userController.getProfile);

module.exports = router;