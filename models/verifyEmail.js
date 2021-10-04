// Depencencies
import mongoose from "mongoose";
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
		default: Date.now(),
		expires: 3600 * 24
	}
});

const VerifyEmail = mongoose.model("VerifyEmail", verifyEmailSchema);

export default VerifyEmail;
