// Dependencies
import mongoose from "mongoose";
import moment from "moment";

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
	createdAt: { type: Date, default: moment.utc().format() }
});

// Quotes schema / collections
const Quotes = mongoose.model("Quotes", quotesSchema);

export default Quotes;
