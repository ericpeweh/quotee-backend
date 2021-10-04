// Dependencies
import mongoose from "mongoose";
import moment from "moment";

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

export default Article;
