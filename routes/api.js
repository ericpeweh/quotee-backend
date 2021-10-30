// Dependencies
const express = require("express");

// Contollers
const getImages = require("../controllers/api.js").getImages;

// Middlewares
const isAuth = require("../middlewares/auth.js").isAuth;

// Express router
const router = express.Router();

// Access controllers
router.get("/images", isAuth, getImages);

module.exports = router;
