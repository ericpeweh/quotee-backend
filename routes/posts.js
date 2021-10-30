// Dependencies
const express = require("express");

// Controllers
const getPosts = require("../controllers/posts.js").getPosts;
const getPost = require("../controllers/posts.js").getPost;
const editPost = require("../controllers/posts.js").editPost;
const getEditPost = require("../controllers/posts.js").getEditPost;
const getPostsBySearch = require("../controllers/posts.js").getPostsBySearch;
const createPost = require("../controllers/posts.js").createPost;
const getLikes = require("../controllers/posts.js").getLikes;
const getTopQuotes = require("../controllers/posts.js").getTopQuotes;
const likePost = require("../controllers/posts.js").likePost;
const favoritePost = require("../controllers/posts.js").favoritePost;
const archivePost = require("../controllers/posts.js").archivePost;
const unarchivePost = require("../controllers/posts.js").unarchivePost;
const deletePost = require("../controllers/posts.js").deletePost;
const reportPost = require("../controllers/posts.js").reportPost;

// Middlewares
const isAuth = require("../middlewares/auth.js").isAuth;
const quotesValidator = require("../middlewares/posts.js").quotesValidator;
const tagsValidator = require("../middlewares/posts.js").tagsValidator;

// Express router
const router = express.Router();

// Access controllers
router.get("/", isAuth, getPosts);
router.get("/top", isAuth, getTopQuotes);
router.get("/search", isAuth, getPostsBySearch);
router.get("/:postId", isAuth, getPost);
router.patch("/:postId", isAuth, editPost);
router.delete("/:postId", isAuth, deletePost);
router.get("/:postId/edit", isAuth, getEditPost);
router.get("/:postId/likes", isAuth, getLikes);
router.post("/", isAuth, quotesValidator, tagsValidator, createPost);
router.patch("/:postId/likePost", isAuth, likePost);
router.patch("/:postId/favoritePost", isAuth, favoritePost);
router.patch("/:postId/archivePost", isAuth, archivePost);
router.patch("/:postId/unarchivePost", isAuth, unarchivePost);
router.patch("/:postId/report", isAuth, reportPost);

module.exports = router;
