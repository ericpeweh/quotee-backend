// Dependencies
import mongoose from "mongoose";
import moment from "moment";
import xss from "xss";
import { sanitizeHTML } from "../utils/sanitizeHTML.js";

// Models
import Quotes from "../models/quotes.js";
import User from "../models/user.js";
import Report from "../models/report.js";

// GET /p/
export const getPosts = async (req, res) => {
	const { quotes } = req.query;
	const LIMIT = 10;

	try {
		const total = await Quotes.countDocuments({});
		const hasMore = total > quotes + LIMIT;

		const posts = await Quotes.find()
			.sort({ _id: -1 })
			.skip(Number(quotes))
			.limit(LIMIT)
			.populate("authorId", "profilePicture");

		const structuredPosts = posts.map(post => ({
			quotes: post.quotes,
			author: post.author,
			tags: post.tags,
			createdAt: post.createdAt,
			_id: post._id,
			likes: post.likes,
			profilePicture: post.authorId.profilePicture
		}));

		res.status(200).json({ posts: structuredPosts, hasMore });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// GET /p/:postId
export const getPost = async (req, res) => {
	try {
		const { postId } = req.params;
		const post = await Quotes.findById(postId).populate("authorId", "profilePicture");

		const postData = {
			_id: post._id,
			quotes: post.quotes,
			author: post.author,
			profilePicture: post.authorId.profilePicture,
			tags: post.tags,
			likes: post.likes,
			createdAt: post.createdAt
		};

		res.status(200).json(postData);
	} catch (error) {
		res.status(404).json({ message: "Post not found!" });
	}
};

// PATCH /p/:postId/edit
export const editPost = async (req, res) => {
	const username = req.username;
	const { postId } = req.params;
	const { quotes: editedQuotes, tags: editedTags } = req.body;

	if (!mongoose.Types.ObjectId.isValid(postId))
		return res.status(404).json({ message: "Invalid post id!" });

	const post = await Quotes.findById(postId);

	if (!post) return res.status(404).json({ message: "Post not found!" });

	if (username !== post.author) return res.status(401).send("Not authorized.");

	const isPostedMoreThan1hAgo = moment.utc().diff(moment.utc(post.createdAt), "hours") > 0;

	if (isPostedMoreThan1hAgo)
		return res.status(400).json({ message: "Post was created more than 1 hour ago." });

	await Quotes.findByIdAndUpdate(postId, { quotes: editedQuotes, tags: editedTags });

	return res.status(200).json({ message: "Post successfully updated." });
};

// GET /p/:postId/edit
export const getEditPost = async (req, res) => {
	const username = req.username;
	const { postId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(postId))
		return res.status(404).json({ message: "Invalid post id!" });

	const post = await Quotes.findById(postId);

	if (!post) return res.status(404).json({ message: "Post not found!" });

	if (username !== post.author) return res.status(401).send("Not authorized.");

	const postData = {
		_id: post._id,
		quotes: post.quotes,
		tags: post.tags
	};

	res.status(200).json(postData);
};

// GET /p/top
export const getTopQuotes = async (req, res) => {
	try {
		const posts = await Quotes.find({}).sort({ likes: -1 }).limit(4);

		const topQuotes = posts.map(post => ({
			quotes: post.quotes,
			quotesId: post._id,
			author: post.author
		}));

		return res.status(200).json(topQuotes);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// GET /p/:postId/likes
export const getLikes = async (req, res) => {
	try {
		const { postId } = req.params;
		const { username = "", current = 0 } = req.query;
		const LIMIT = 20;

		const selectedPost = await Quotes.findById(postId);
		const totalLikes = selectedPost.likes.length;
		const hasMore = totalLikes > current + LIMIT;

		// Build query up
		const usernameRegex = new RegExp(username || "(.*?)", "i");

		const post = await Quotes.findById(postId)
			.sort({ _id: -1 })
			.skip(Number(current))
			.limit(LIMIT)
			.populate({
				path: "likes",
				select: "username posts profilePicture",
				match: {
					username: usernameRegex
				}
			});

		const likes = post.likes.map(user => ({
			username: user.username,
			posts: user.posts.length,
			profilePicture: user.profilePicture
		}));

		res.status(200).json({ likes, hasMore });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// GET /p/search?quotes=quotes&author=author&tags=tags&fromDate=fromDate&toDate=toDate
export const getPostsBySearch = async (req, res) => {
	try {
		let { quotes = "", author = "", tags, fromDate = "", toDate = "" } = req.query;

		// Build query up
		const quotesRegex = new RegExp(quotes || "(.*?)", "i");
		const authorRegex = new RegExp(author || "(.*?)", "i");
		const tagsQuery = tags && tags !== "null" ? { tags: { $in: tags?.split(",") } } : {};

		if (fromDate === "null" || !fromDate) {
			fromDate = "01/01/2021";
		}
		if (toDate === "null" || !toDate) toDate = moment.utc().format("DD/MM/YYYY");

		const dateQuery = {
			createdAt: {
				$lte: moment.utc(`${toDate} 24:00:00`, "DD/MM/YYYY hh:mm:ss").format(),
				$gte: moment.utc(`${fromDate} 00:00:00`, "DD/MM/YYYY hh:mm:ss").format()
			}
		};

		const posts = await Quotes.find({
			quotes: quotesRegex,
			author: authorRegex,
			...tagsQuery,
			...dateQuery
		})
			.sort({ _id: -1 })
			.populate("authorId", "profilePicture");

		const structuredPosts = posts.map(post => ({
			quotes: post.quotes,
			author: post.author,
			tags: post.tags,
			createdAt: post.createdAt,
			_id: post._id,
			likes: post.likes,
			profilePicture: post.authorId.profilePicture
		}));

		res.status(200).json(structuredPosts);
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// POST /p
export const createPost = async (req, res) => {
	const userId = xss(req.userId);
	const username = xss(req.username);
	const cleanedQuotes = xss(sanitizeHTML(req.body.quotes));
	const cleanedTags = req.body.tags.map(tag => sanitizeHTML(tag.replace(/#/g, "")));

	const newPost = new Quotes({
		quotes: cleanedQuotes,
		tags: cleanedTags,
		authorId: userId,
		author: username,
		createdAt: moment.utc().format()
	});

	try {
		const post = await newPost.save();
		// Add new post id to user posts
		await User.findByIdAndUpdate(userId, { $push: { posts: post._id } }, { upsert: true });
		res.status(201).json({
			postId: newPost._id,
			message: "Successfully created a new quotes.",
			author: newPost.author
		});
	} catch (error) {
		res.status(409).json({ message: error.message });
	}
};

// PATCH /p/:postId/likePost
export const likePost = async (req, res) => {
	const { postId: id } = req.params;

	if (!req.username || !req.userId) return res.json({ message: "Unauthenticated" });

	if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send("Invalid post id!");

	const post = await Quotes.findById(id);

	if (!post) return res.status(404).json({ message: "Post not found!" });

	const index = post.likes.findIndex(id => {
		return id.toString() === String(req.userId);
	});

	if (index === -1) {
		post.likes.push(req.userId);
	} else {
		post.likes = post.likes.filter(id => id.toString() !== String(req.userId));
	}

	const updatedPost = await Quotes.findByIdAndUpdate(
		id,
		post,
		{ new: true } // show the new version of post
	);

	res.status(200).json(updatedPost);
};

// PATCH /p/:postId/favoritePost
export const favoritePost = async (req, res) => {
	const { postId } = req.params;

	if (!req.username || !req.userId) return res.json({ message: "Unauthenticated" });

	if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(404).send("Invalid post id!");

	const post = await Quotes.findById(postId);
	if (!post) return res.status(404).json({ message: "Post not found!" });

	const user = await User.findOne({ username: req.username });

	const index = user.favoritedPosts.findIndex(id => {
		return id.toString() === String(postId);
	});

	if (index === -1) {
		user.favoritedPosts.push(postId);
	} else {
		user.favoritedPosts = user.favoritedPosts.filter(id => id.toString() !== String(postId));
	}

	const updatedUser = await User.findOneAndUpdate(
		{ username: req.username },
		{ favoritedPosts: user.favoritedPosts },
		{ new: true } // show the new version of post
	);

	const newFavorites = await User.findOne({ username: req.username }).populate({
		path: "favoritedPosts",
		populate: {
			path: "authorId",
			select: "profilePicture"
		},
		options: { sort: { _id: -1 } }
	});

	const structuredFavorites = newFavorites.favoritedPosts.map(post => ({
		_id: post._id,
		quotes: post.quotes,
		author: post.author,
		tags: post.tags,
		likes: post.likes,
		createdAt: post.createdAt,
		profilePicture: post.authorId.profilePicture
	}));

	res
		.status(200)
		.json({ updatedFavorites: updatedUser.favoritedPosts, newFavorites: structuredFavorites });
};

// PATCH /p/:postId/archivePost
export const archivePost = async (req, res) => {
	const username = req.username;
	const { postId } = req.params;

	const post = await Quotes.findById(postId);

	if (!post) return res.status(404).json({ message: "Post not found!" });

	if (post.author !== username) return res.status(401).json({ message: "Not authorized" });

	const user = await User.findOne({ username });
	const index = user.archivedPosts.find(post => post.quotesId === String(post._id));

	if (index) return res.status(400).json({ message: "Post is already archived." });

	user.archivedPosts.push({
		quotesId: post._id,
		quotes: post.quotes,
		authorId: post.authorId,
		author: post.author,
		tags: post.tags,
		likes: post.likes,
		createdAt: post.createdAt,
		archivedAt: new Date()
	});

	const updatedUser = await User.findOneAndUpdate(
		{ username },
		{ archivedPosts: user.archivedPosts },
		{ new: true }
	);

	// Remove post from "posts" of user
	await User.findOneAndUpdate({ username }, { $pull: { posts: post._id } });

	// Delete post from quotes collections
	await Quotes.findByIdAndDelete(postId);

	return res.status(200).json({ archivedPosts: updatedUser.archivedPosts, archivedPostId: postId });
};

export const unarchivePost = async (req, res) => {
	const username = req.username;
	const { postId } = req.params;

	const post = await Quotes.findById(postId);
	const user = await User.findOne({ username });
	const index = user.archivedPosts.findIndex(post => {
		return post.quotesId === String(postId);
	});

	// Check if post is archived or not
	if (post || index === -1) return res.status(400).json({ message: "Post is not archived!" });
	const archivedPost = user.archivedPosts[index];

	const repost = new Quotes({
		_id: archivedPost.quotesId,
		quotes: archivedPost.quotes,
		tags: archivedPost.tags,
		authorId: archivedPost.authorId,
		author: archivedPost.author,
		createdAt: archivedPost.createdAt
	});

	// Unarchive post / re-post to Quotes collections
	const unarchivedPost = await repost.save();

	// Add post to user "posts"
	await User.findOneAndUpdate({ username }, { $push: { posts: archivedPost.quotesId } });

	// Delete from archived after repost
	const filteredArchived = user.archivedPosts.filter(
		post => post.quotesId !== archivedPost.quotesId
	);

	const updatedUser = await User.findOneAndUpdate(
		{ username },
		{ archivedPosts: filteredArchived },
		{ new: true }
	);

	const structuredArchived = updatedUser.archivedPosts.map(post => ({
		_id: post.quotesId,
		quotes: post.quotes,
		author: post.author,
		tags: post.tags,
		likes: post.likes,
		createdAt: post.createdAt,
		archivedAt: post.archivedAt,
		profilePicture: updatedUser.profilePicture
	}));

	return res.status(200).json(structuredArchived);
};

// DELETE /p/:postId
export const deletePost = async (req, res) => {
	const username = req.username;
	const { postId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(postId))
		return res.status(404).json({ message: "Invalid post id!" });

	const post = await Quotes.findById(postId);

	if (!post) return res.status(404).json({ message: "Post not found!" });

	if (username !== post.author) return res.status(401).send("Not authorized.");

	// Delete post from Quotes collection
	await Quotes.findByIdAndRemove(postId);

	// Delete post from User collection
	const user = await User.findOne({ username });

	await User.findOneAndUpdate({ username }, { $pull: { posts: postId } });

	// Delete favorites post from User collection
	await User.updateMany(
		{ favoritedPosts: { $in: [postId] } },
		{ $pull: { favoritedPosts: postId } }
	);

	return res.status(200).json({ message: "Post successfully deleted.", postId });
};

export const reportPost = async (req, res) => {
	const { userId, username } = req;
	const { postId } = req.params;
	const { code } = req.query;

	const reportReasons = [
		{ text: "Spam", code: "001" },
		{ text: "Kata kasar atau tidak pantas", code: "002" },
		{ text: "Berisi ujaran kebencian atau kekerasan", code: "003" },
		{ text: "Plagiarisme", code: "004" }
	];

	const isFound = reportReasons.filter(reason => reason.code === code);
	if (isFound.length === 0) {
		return res.status(404).json({ message: "Report code not found!" });
	}

	const selectedPost = await Quotes.findById(postId);

	if (!selectedPost) {
		return res.status(404).json({ messaeg: "Post not found!" });
	}

	if (selectedPost.author === username) {
		return res.status(401).json({ message: "You're not allowed to do that!" });
	}

	const newReport = new Report({
		issuedBy: userId,
		postId,
		postAuthor: selectedPost.authorId,
		reasonCode: isFound[0].code,
		reasonText: isFound[0].text
	});

	await newReport.save();

	return res.status(200).json({ message: "Thank you for your report." });
};
