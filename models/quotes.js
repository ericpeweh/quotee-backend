// Dependencies
const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

// Model schema
const quotesSchema = Schema({
	quotes: String,
	authorId: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	author: String,
	tags: [String],
	likes: {
		type: [Schema.Types.ObjectId],
		ref: "User",
		default: []
	},
	createdAt: { type: Date, default: moment.utc().format() },
	qotd: {
		type: Boolean,
		required: true,
		default: false
	}
});

// Quotes schema / collections
const Quotes = mongoose.model("Quotes", quotesSchema);

module.exports = Quotes;
