// Dependencies
const mongoose = require("mongoose");

// Models
const Article = require("../models/article.js");

// Utils
const sanitizeHTML = require("../utils/sanitizeHTML.js").sanitizeHTML;

// GET /a
module.exports.getArticles = async (req, res) => {
	const articles = await Article.find({}).limit(4);

	const structuredArticles = articles.map(article => ({
		articleId: article._id,
		title: article.title,
		subtitle: article.subtitle,
		bannerImage: article.bannerImage
	}));

	res.status(200).json(structuredArticles);
};

// GET /a/:articleId
module.exports.getArticle = async (req, res) => {
	const { articleId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(articleId))
		return res.status(404).json({ message: "Invalid article id!" });

	const article = await Article.findById(articleId);

	if (!article) return res.status(404).json({ message: "Can't find article." });

	res.status(200).json(article);
};

// POST /a
module.exports.createArticle = async (req, res) => {
	const { author, title, subtitle, bannerImage, body } = req.body;
	const cleanTitle = sanitizeHTML(title);
	const cleanSubtitle = sanitizeHTML(subtitle);

	const newArticle = new Article({
		author,
		title: cleanTitle,
		subtitle: cleanSubtitle,
		bannerImage,
		body
	});

	try {
		const article = await newArticle.save();

		res.status(201).json(article);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
