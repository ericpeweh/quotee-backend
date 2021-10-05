// Depencencies
import mongoose from "mongoose";
import moment from "moment";

const Schema = mongoose.Schema;

const resetPasswordSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	token: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: moment.utc(),
		expires: 3600
	}
});

const ResetPassword = mongoose.model("ResetPassword", resetPasswordSchema);

export default ResetPassword;
