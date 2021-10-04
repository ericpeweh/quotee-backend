// Dependencies
import express from "express";

// Controllers
import {
	getPosts,
	getPost,
	editPost,
	getEditPost,
	getPostsBySearch,
	createPost,
	getLikes,
	getTopQuotes,
	likePost,
	favoritePost,
	archivePost,
	unarchivePost,
	deletePost,
	reportPost
} from "../controllers/posts.js";

// Middlewares
import { isAuth } from "../middlewares/auth.js";
import { quotesValidator, tagsValidator } from "../middlewares/posts.js";

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

export default router;
