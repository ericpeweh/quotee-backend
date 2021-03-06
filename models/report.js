// Dependencies
const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

// Model schema
const reportSchema = Schema({
	createdAt: {
		type: Date,
		default: moment.utc().format()
	},
	issuedBy: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	postId: {
		type: Schema.Types.ObjectId,
		ref: "Quotes"
	},
	postAuthor: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	reasonCode: String,
	reasonText: String
});

// Report schema / collections
const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
