// Depencencies
const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

const verifyEmailSchema = new Schema({
	email: {
		type: String,
		required: true
	},
	token: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: moment.utc(),
		expires: "7d"
	}
});

const VerifyEmail = mongoose.model("VerifyEmail", verifyEmailSchema);

module.exports = VerifyEmail;
