// Dependencies
const express = require("express");

// Contollers
const getArticles = require("../controllers/articles.js").getArticles;
const getArticle = require("../controllers/articles.js").getArticle;
const createArticle = require("../controllers/articles.js").createArticle;

// Middlewares
const isAuth = require("../middlewares/auth.js").isAuth;

// Express router
const router = express.Router();

// Access controllers
router.get("/", isAuth, getArticles);
router.get("/:articleId", getArticle);
// router.post("/", createArticle);

module.exports = router;
