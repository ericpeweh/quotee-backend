// Dependencies
const mongoose = require("mongoose");

// Models
const Article = require("../models/article.js");

// Utils
const sanitizeHTML = require("../utils/sanitizeHTML.js").sanitizeHTML;

// GET /a
module.exports.getArticles = async (req, res) => {
	try {
		const articles = await Article.find({}).limit(4);

		const structuredArticles = articles.map(article => ({
			articleId: article._id,
			title: article.title,
			subtitle: article.subtitle,
			bannerImage: article.bannerImage
		}));

		return res.status(200).json(structuredArticles);
	} catch (err) {
		return res.status(400).json({ message: err.messages });
	}
};

// GET /a/:articleId
module.exports.getArticle = async (req, res) => {
	try {
		const { articleId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(articleId)) throw { message: "Invalid article id!" };

		const article = await Article.findById(articleId);

		if (!article) throw { message: "Can't find article." };

		return res.status(200).json(article);
	} catch (err) {
		return res.status(404).json({ message: err.message });
	}
};

// POST /a
module.exports.createArticle = async (req, res) => {
	try {
		const article = await newArticle.save();

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

		res.status(201).json(article);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
