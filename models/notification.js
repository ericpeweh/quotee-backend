// Dependencies
import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Model schema
const notificationSchema = Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	subscription: {
		type: Object,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now(),
		expires: 3600 * 24 * 60
	}
});

// Notification schema / collections
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
