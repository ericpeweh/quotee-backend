// Dependencies
import express from "express";

// Contollers
import { getArticles, getArticle, createArticle } from "../controllers/articles.js";

// Middlewares
import { isAuth } from "../middlewares/auth.js";

// Express router
const router = express.Router();

// Access controllers
router.get("/", isAuth, getArticles);
router.get("/:articleId", getArticle);
// router.post("/", createArticle);

export default router;
