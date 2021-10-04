// Dependencies
import mongoose from "mongoose";
import moment from "moment";

const Schema = mongoose.Schema;

const notificationsSchema = new Schema({
	createdAt: {
		type: Date,
		default: moment.utc().format()
	},
	announcer: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	profilePicture: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true
	}
});

const archivedPostsSchema = new Schema({
	quotesId: "String",
	archivedAt: {
		type: Date,
		default: new Date()
	},
	quotes: {
		type: String,
		required: true
	},
	authorId: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	author: String,
	tags: {
		type: [String],
		required: true
	},
	likes: {
		type: [Schema.Types.ObjectId],
		ref: "User",
		default: []
	},
	createdAt: { type: Date, default: moment.utc().format() }
});

const userSchema = new Schema({
	username: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
		minLength: 6,
		maxLength: 30,
		unique: true
	},
	email: {
		type: String,
		required: true,
		trim: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	fullName: {
		type: String,
		required: true
	},
	description: {
		type: String,
		default: "Check out my quotes."
	},
	phoneNumber: {
		type: String,
		default: ""
	},
	profilePicture: String,
	isEmailVerified: {
		type: Boolean,
		default: false
	},
	isPhoneNumberVerified: {
		type: Boolean,
		default: false
	},
	allowNotifications: {
		type: Boolean,
		default: true
	},
	role: {
		type: String,
		required: true,
		enum: ["root", "admin", "user"]
	},
	passwordLastChange: {
		type: Date,
		default: moment.utc().format()
	},
	createdAt: {
		type: Date,
		default: moment.utc().format()
	},
	followers: {
		type: [Schema.Types.ObjectId],
		ref: "User"
	},
	following: {
		type: [Schema.Types.ObjectId],
		ref: "User"
	},
	posts: {
		type: [Schema.Types.ObjectId],
		ref: "Quotes"
	},
	favoritedPosts: {
		type: [Schema.Types.ObjectId],
		ref: "Quotes"
	},
	archivedPosts: [archivedPostsSchema],
	notifications: [notificationsSchema]
});

const User = mongoose.model("User", userSchema);

export default User;
