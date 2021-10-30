// Dependencies
const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

// Model schema
const articleSchema = Schema({
	createdAt: { type: Date, default: moment.utc().format() },
	author: String,
	title: String,
	subtitle: String,
	bannerImage: String,
	body: String
});

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
