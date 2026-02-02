
const express = require("express");
const upload = require("../middleware/upload");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.get("/profile", isAuth, userController.getProfile);




module.exports = router;