// Dependencies
const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

// Model schema
const reportUserSchema = Schema({
	createdAt: {
		type: Date,
		default: moment.utc().format()
	},
	issuedBy: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	userId: {
		type: Schema.Types.ObjectId,
		ref: "Quotes"
	},
	reasonCode: String,
	reasonText: String,
	description: String
});

// Report schema / collections
const ReportUser = mongoose.model("ReportUser", reportUserSchema);

module.exports = ReportUser;
