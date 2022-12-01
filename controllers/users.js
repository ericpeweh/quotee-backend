// Dependencies
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const fs = require("fs");
const handlebars = require("handlebars");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const path = require("path");
// const dirname = require("path").dirname;
// const fileURLToPath = require("url").fileURLToPath;
const mongoose = require("mongoose");
const validatePassword = require("../utils/validatePassword.js");

// Utils
const avatarsURL = require("../utils/avatars.js").avatarsURL;
const cloudinary = require("../utils/cloudinary.js");
const compressImage = require("../utils/compressImage.js");
const sanitizeHTML = require("../utils/sanitizeHTML.js").sanitizeHTML;

// // Use dirname in Node Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Models
const User = require("../models/user.js");
const VerifyEmail = require("../models/verifyEmail.js");
const ResetPassword = require("../models/resetPassword.js");
const ReportUser = require("../models/reportUser.js");

// POST /u/signin
module.exports.signIn = async (req, res) => {
	const { usernameOrEmail, password } = req.body;
	const emailValidator =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	const isEmail = emailValidator.test(usernameOrEmail);

	try {
		// Check user is registered
		const registeredUser = await User.findOne(
			isEmail ? { email: usernameOrEmail } : { username: usernameOrEmail }
		);
		if (!registeredUser) return res.status(403).json({ message: "User not found!" });

		const isAuth = await bcrypt.compare(password, registeredUser.password);
		if (!isAuth)
			return res
				.status(403)
				.json({ message: `${isEmail ? "Email" : "Username"} or password is incorrect.` });

		if (isAuth && registeredUser && registeredUser.isEmailVerified === false) {
			return res.status(401).json({ message: "Please verify your email address." });
		}

		const token = jwt.sign(
			{
				userId: registeredUser._id,
				username: registeredUser.username
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		// res.cookie("jwt", token, {
		// 	httpOnly: true,
		// 	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
		// 	sameSite: "none",
		// 	secure: true
		// });

		res.status(200).json({ message: "Signed in successfully.", token });
	} catch (error) {
		return res.status(400).json({ message: error?.message });
	}
};

// POST /u/signup
module.exports.signUp = async (req, res) => {
	const { firstName, lastName, username, email, password, passwordConfirm } = req.body;

	try {
		// Check email is valid
		const emailValidator =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		const isEmail = emailValidator.test(email);
		if (!isEmail) return res.status(400).json({ message: "Email is not valid!" });

		// Check if email is taken
		const emailExistingUser = await User.findOne({ email });
		if (emailExistingUser && emailExistingUser.isEmailVerified === true) {
			return res.status(400).json({ message: "Email is already registered." });
		}
		if (emailExistingUser && emailExistingUser.isEmailVerified === false)
			return res.status(400).json({
				message:
					"Email is already registered. Please activate your account by link we sent to your email."
			});

		// Check if username in right format
		const regex = /^[A-Za-z0-9]+$/;
		const usernameIsValid = regex.test(username);
		if (!usernameIsValid) {
			return res.status(400).json({
				message: "Username can only contain alphanumeric characters."
			});
		}

		// Check if username shorter or longer than 30 characters
		const usernameLength = username.trim().length;
		if (usernameLength < 6 || usernameLength > 30)
			return res.status(400).json({
				message: "Your username must be longer than 5 characters and shorter than 20 characters."
			});

		// Check if username is taken
		const usernameExistingUser = await User.findOne({ username });
		if (usernameExistingUser)
			return res.status(400).json({
				message: "Username not available"
			});

		// Check password & password confirm
		if (password !== passwordConfirm) {
			return res.status(400).json({ message: "Password don't match." });
		}

		// Check password format
		const passwordIsValid = validatePassword.validate(password);
		if (!passwordIsValid) {
			return res.status(400).json({
				message:
					"Password should be minimum eight characters, at least one uppercase letter, one lowercase letter and a number."
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Random avatars image
		const imageURL = avatarsURL[Math.floor(Math.random() * 10)];

		// Create new user
		const newUser = await User.create({
			username,
			email,
			password: hashedPassword,
			fullName: `${firstName} ${lastName}`,
			role: "user",
			profilePicture: imageURL
		});

		// Generate unique token for email verification
		const token = jwt.sign({ email }, process.env.JWT_SECRET, {
			expiresIn: "7d"
		});

		// Store token in database
		await VerifyEmail.create({
			email,
			token
		});

		// Email account
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.VERIFY_EMAIL_EMAIL,
				pass: process.env.VERIFY_EMAIL_PASSWORD
			}
		});

		// Email template
		const filepath = path.join(__dirname, "../assets/emailTemplate.html");
		const emailTemplateSrc = fs.readFileSync(filepath, "utf8");

		const emailTemplate = handlebars.compile(emailTemplateSrc);
		const htmlToSend = emailTemplate({
			fullName: `${firstName} ${lastName}`,
			verificationURL: `https://quoteequotes.xyz/verifyEmail/${token}`
		});

		const mailOptions = {
			from: "Quotee Auth <quoteeid.noreply@gmail.com>",
			to: email,
			subject: "[Quotee] Welcome to Quotee. Let's verify your email",
			html: htmlToSend
		};

		// Send email verification
		const info = await transporter.sendMail(mailOptions).catch(error => {
			throw { message: "Something went wrong!" };
		});

		// Add new user notification
		const newNotification = {
			announcer: "Quotee",
			name: "Welcome to Quotee",
			description:
				"Your account has been activated, now you can start sharing quotes. You could also update your profile.",
			profilePicture:
				"https://res.cloudinary.com/quoteequotesid/image/upload/v1633262782/system/quoteelogo.png",
			url: `https://www.quoteequotes.xyz/settings/account`
		};

		await User.findByIdAndUpdate(newUser._id, {
			$push: { notifications: newNotification }
		});

		res.status(200).json({
			message: `Account successfully registered, please click on the link that has been just sent to your email to activate your account.`
		});
	} catch (error) {
		console.log(error);
		return res.status(400).json({ messsage: error.message });
	}
};

// POST /u/signOut
module.exports.signOut = async (req, res) => {
	try {
		// res.cookie("jwt", "", {
		// 	maxAge: 0 // Expires immediately
		// });

		res.status(200).json({ message: "Signed out successfully!" });
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
};

// POST /u/auth
module.exports.auth = async (req, res) => {
	try {
		// const cookie = req.cookies?.jwt;
		if (!req.headers.authorization) {
			throw { message: "You're not authorized." };
		}
		const token = req.headers.authorization?.split(" ")[1];

		const authenticated = jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
			if (error) {
				if (error.message === "jwt expired") {
					throw { message: "Expired" };
				}
				throw { message: "Unauthenticated!" };
			}
			return decoded;
		});

		const user = await User.findById(authenticated.userId);

		const unreadNotifications = user.notifications.reduce(
			(total, notification) => (!notification.read ? (total += 1) : total),
			0
		);

		return res.status(200).json({
			username: user.username,
			fullName: user.fullName,
			userId: user._id,
			profilePicture: user.profilePicture,
			favoritedPosts: user.favoritedPosts,
			archivedPosts: user.archivedPosts,
			followers: user.followers,
			following: user.following,
			allowNotifications: user.allowNotifications,
			unreadNotifications
		});
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
};

// POST /u/verifyEmail
module.exports.verifyEmail = async (req, res) => {
	const { token } = req.body;

	try {
		// Verify token
		const user = jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
			if (error) {
				throw { message: "Invalid token!" };
			}
			return decoded;
		});

		// Check token in verifyEmail collections
		const userVerification = await VerifyEmail.findOne({ token });
		const registeredUser = await User.findOne({ email: user.email });
		if (userVerification && registeredUser) {
			await User.findOneAndUpdate({ email: userVerification.email }, { isEmailVerified: true });

			await VerifyEmail.findOneAndDelete({ email: userVerification.email });

			return res.status(200).json({
				message: "Your account has been activated."
			});
		}

		// Resend Token if user is registered
		if (!userVerification && registeredUser && !registeredUser.isEmailVerified) {
			// Generate unique token for email verification
			const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
				expiresIn: "7d"
			});

			// Store token in database
			await VerifyEmail.create({
				email: user.email,
				token
			});

			// Send new token
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.VERIFY_EMAIL_EMAIL,
					pass: process.env.VERIFY_EMAIL_PASSWORD
				}
			});

			// Email template
			const filepath = path.join(__dirname, "../assets/emailTemplate.html");
			const emailTemplateSrc = fs.readFileSync(filepath, "utf8");

			const emailTemplate = handlebars.compile(emailTemplateSrc);
			const htmlToSend = emailTemplate({
				fullName: `${registeredUser.fullName}`,
				verificationURL: `https://quoteequotes.xyz/verifyEmail/${token}`
			});

			const mailOptions = {
				from: "Quotee Auth <quoteeid.noreply@gmail.com>",
				to: registeredUser.email,
				subject: "[Quotee] Welcome to Quotee. Let's verify your email",
				html: htmlToSend
			};

			// Send email verification
			await transporter.sendMail(mailOptions).catch(error => {
				throw { message: "Something went wrong!" };
			});

			return res
				.status(401)
				.json({ message: "Your token has expired, a new token is sent to your email." });
		}
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
};

// POST /u/changePassword
module.exports.changePassword = async (req, res) => {
	try {
		const username = req.username;
		const { currentPassword, newPassword, newPasswordConfirm } = req.body;

		if (newPassword !== newPasswordConfirm) {
			throw { message: "Password don't match.", status: 400 };
		}

		const user = await User.findOne({ username });
		const isAuth = await bcrypt.compare(currentPassword, user.password);

		if (!isAuth) {
			throw { message: "Wrong password, please try again.", status: 403 };
		}

		// Check password format
		const passwordIsValid = validatePassword.validate(newPassword);
		if (!passwordIsValid) {
			throw {
				message:
					"Your new password should be minimum eight characters, at least one uppercase letter, one lowercase letter, and a number.",
				status: 400
			};
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, 12);
		await User.findOneAndUpdate({ username }, { password: hashedNewPassword });

		return res.status(200).json({ message: "Your password has been changed successfully." });
	} catch (error) {
		return res.status(error.status || 400).json({ message: error.message });
	}
};

// POST /u/resetPassword
module.exports.resetPassword = async (req, res) => {
	const { usernameOrEmail } = req.body;
	const emailValidator =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	const isEmail = emailValidator.test(usernameOrEmail);

	try {
		// Check user is registered
		const registeredUser = await User.findOne(
			isEmail ? { email: usernameOrEmail } : { username: usernameOrEmail }
		);
		if (!registeredUser)
			return res
				.status(403)
				.json({ message: `Can't find user with that ${isEmail ? "email" : "username"}!` });

		// Generate unique token for email verification
		const token = jwt.sign(
			{
				email: registeredUser.email,
				username: registeredUser.username,
				userId: registeredUser._id
			},
			process.env.JWT_SECRET,
			{
				expiresIn: "1h"
			}
		);

		// Store token in database
		await ResetPassword.create({
			userId: registeredUser._id,
			token
		});

		// Email account
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.VERIFY_EMAIL_EMAIL,
				pass: process.env.VERIFY_EMAIL_PASSWORD
			}
		});

		// Email template
		const filepath = path.join(__dirname, "../assets/resetPasswordEmailTemplate.html");
		const emailTemplateSrc = fs.readFileSync(filepath, "utf8");

		const emailTemplate = handlebars.compile(emailTemplateSrc);
		const htmlToSend = emailTemplate({
			fullName: registeredUser.fullName,
			resetPasswordURL: `https://www.quoteequotes.xyz/verifyResetPassword/${token}`
		});

		const mailOptions = {
			from: "Quotee Auth <quoteeid.noreply@gmail.com>",
			to: registeredUser.email,
			subject: "[Quotee] Reset Password",
			html: htmlToSend
		};

		// Send email verification
		const info = await transporter.sendMail(mailOptions).catch(error => {
			throw { message: error.message };
		});

		res.status(200).json({
			message: `Reset password request has been sent to your email (${registeredUser.email}) and valid for the next 1h. Please also check it inside your spam folder.`
		});
	} catch (error) {
		return res.status(400).json({ message: error?.message });
	}
};

// POST /u/verifyResetPassword
module.exports.verifyResetPassword = async (req, res) => {
	const { token, password, passwordConfirm } = req.body;

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
			if (error) {
				throw { message: "Invalid token!" };
			}
			return decoded;
		});

		// Check password & password confirm
		if (password !== passwordConfirm) {
			return res.status(400).json({ message: "Password don't match." });
		}

		// Check password format
		const passwordIsValid = validatePassword.validate(password);
		if (!passwordIsValid) {
			return res.status(400).json({
				message:
					"Password should be minimum eight characters, at least one uppercase letter, one lowercase letter and a number."
			});
		}

		// Check token in verifyEmail collections
		const resetPasswordRecord = await ResetPassword.findOne({ token });
		const registeredUser = await User.findById(resetPasswordRecord.userId);
		const isTokenValid = resetPasswordRecord.userId.toString() === decoded.userId;

		if (resetPasswordRecord && isTokenValid && registeredUser) {
			// Hash password
			const hashedPassword = await bcrypt.hash(password, 12);

			await User.findByIdAndUpdate(resetPasswordRecord.userId.toString(), {
				password: hashedPassword,
				passwordLastChange: moment.utc()
			});

			await ResetPassword.findOneAndDelete({ token });

			return res.status(200).json({
				message: "Your password has been changed."
			});
		}

		return res.status(400).json({ message: "Invalid token!" });
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
};

// GET /u/usersuggestion
module.exports.userSuggestion = async (req, res) => {
	try {
		const users = await User.aggregate([
			{ $match: { isEmailVerified: true, username: { $ne: req.username } } },
			{
				$sample: { size: 100 }
			},
			{
				$group: {
					_id: "$_id",
					document: { $push: "$$ROOT" }
				}
			},
			{
				$limit: 6
			},
			{
				$unwind: "$document"
			}
		]);

		const userSuggestion = users.map(user => ({
			userId: user.document._id,
			username: user.document.username,
			posts: user.document.posts.length,
			profilePicture: user.document.profilePicture
		}));

		return res.status(200).json(userSuggestion);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// GET /u/:username
module.exports.userProfile = async (req, res) => {
	const username = req.params.username;

	try {
		const user = await User.findOne({ username });

		if (!user) {
			throw { message: "Can't find user!" };
		}

		const userProfile = {
			userId: user._id,
			username: user.username,
			fullName: user.fullName,
			profilePicture: user.profilePicture,
			description: user.description,
			followers: user.followers,
			following: user.following,
			postAmount: user.posts.length
		};

		return res.status(200).json(userProfile);
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// GET /u/:username/p
module.exports.userPosts = async (req, res) => {
	const username = req.params.username;
	const { quotes = "", current = 0 } = req.query;
	const LIMIT = 10;

	try {
		const checkUser = await User.findOne({ username });
		const total = checkUser.posts.length;
		const hasMore = total > Number(current) + LIMIT;

		if (!checkUser) {
			throw "User not found!";
		}

		// Build query up
		const quotesRegex = new RegExp(quotes || "(.*?)", "i");

		const user = await User.findOne({ username }).populate({
			path: "posts",
			populate: {
				path: "authorId",
				select: "profilePicture"
			},
			match: {
				quotes: quotesRegex
			},
			options: { sort: { _id: -1 } }
		});

		if (!user) {
			throw "User not found!";
		}

		const structuredPosts = user.posts
			.slice(Number(current), Number(current) + LIMIT)
			.map(post => ({
				_id: post._id,
				quotes: post.quotes,
				author: post.author,
				tags: post.tags,
				likes: post.likes,
				createdAt: post.createdAt,
				profilePicture: post.authorId.profilePicture
			}));

		return res.status(200).json({ posts: structuredPosts, hasMore });
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// GET /u/:username/p
module.exports.userFavorites = async (req, res) => {
	const { username: authUsername } = req;
	const username = req.params.username;

	try {
		if (username !== authUsername) {
			throw "Not authenticated";
		}
		const user = await User.findOne({ username }).populate({
			path: "favoritedPosts",
			populate: {
				path: "authorId",
				select: "profilePicture"
			},
			options: { sort: { _id: -1 } }
		});

		if (!user) {
			throw "User not found!";
		}

		const structuredPosts = user.favoritedPosts.map(post => ({
			_id: post._id,
			quotes: post.quotes,
			author: post.author,
			tags: post.tags,
			likes: post.likes,
			createdAt: post.createdAt,
			profilePicture: post.authorId.profilePicture
		}));

		return res.status(200).json(structuredPosts);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// GET /u/:username/p
module.exports.userArchived = async (req, res) => {
	const { username: authUsername } = req;
	const username = req.params.username;

	try {
		if (username !== authUsername) {
			throw "Not authenticated";
		}
		const user = await User.findOne({ username }).populate({
			path: "archivedPosts",
			populate: {
				path: "authorId",
				select: "profilePicture"
			},
			options: { sort: { _id: -1 } }
		});

		if (!user) {
			throw "User not found!";
		}

		const structuredPosts = user.archivedPosts
			.map(post => ({
				_id: post.quotesId,
				quotes: post.quotes,
				author: post.author,
				tags: post.tags,
				likes: post.likes,
				createdAt: post.createdAt,
				archivedAt: post.archivedAt,
				profilePicture: post.authorId.profilePicture
			}))
			.reverse();

		return res.status(200).json(structuredPosts);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

module.exports.userSettings = async (req, res) => {
	const { username: authUsername } = req;
	const username = req.params.username;

	try {
		if (username !== authUsername) {
			throw "Not authenticated";
		}
		const user = await User.findOne({ username });

		if (!user) {
			throw "User not found!";
		}

		const userSettings = {
			fullName: user.fullName,
			email: user.email,
			description: user.description,
			phoneNumber: user.phoneNumber,
			profilePicture: user.profilePicture
		};

		return res.status(200).json(userSettings);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

module.exports.updateProfile = async (req, res) => {
	try {
		const authUsername = req.username;
		const { fullName, phoneNumber, description, username } = req.body;

		if (authUsername !== username) throw { message: "You're not authorized." };

		if (description.length > 160)
			throw { message: "Description must be less than 160 characters." };

		if (fullName.length > 30) throw { message: "Name too long." };

		const user = await User.findOneAndUpdate(
			{ username },
			{ fullName, phoneNumber, description },
			{ new: true }
		);

		const newData = {
			fullName: user.fullName,
			phoneNumber: user.phoneNumber,
			description: user.description,
			message: "Your profile has been updated successfully."
		};

		return res.status(200).json(newData);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

module.exports.changeProfilePicture = async (req, res) => {
	try {
		const username = req.username;
		const newProfilePicture = req.file.path;

		await compressImage(newProfilePicture, username);

		const user = await User.findOne({ username });

		if (user.profilePicture) {
			const oldProfilePicture = user.profilePicture.split("/")[8].replace(".webp", "");

			if (oldProfilePicture.includes(username)) {
				await cloudinary.uploader.destroy(`profilePicture/${oldProfilePicture}`);
			}
		}

		const uploadedImage = await cloudinary.uploader.upload(`/tmp/${username}.webp`, {
			folder: "profilePicture",
			use_filename: true
		});

		fs.unlinkSync(`/tmp/${username}.webp`);

		await User.findOneAndUpdate({ username }, { profilePicture: uploadedImage.secure_url });

		return res.status(200).json({ profilePicture: uploadedImage.secure_url });
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
};

module.exports.deleteProfilePicture = async (req, res) => {
	try {
		const username = req.username;

		const user = await User.findOne({ username });
		if (user.profilePicture) {
			const oldProfilePicture = user.profilePicture.split("/")[8].replace(".webp", "");

			if (oldProfilePicture.includes(username)) {
				await cloudinary.uploader.destroy(`profilePicture/${oldProfilePicture}`);
			}

			await User.findOneAndUpdate({ username }, { profilePicture: "" }, { new: true });
		}

		return res.status(200).json({ profilePicture: "" });
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
};

// PATCH /u/:userId/follow
module.exports.followUser = async (req, res) => {
	const { username, userId } = req;
	const { targetId } = req.params;

	if (!username || !userId) return res.status(401).json({ message: "Unauthorized" });

	if (!mongoose.Types.ObjectId.isValid(targetId))
		return res.status(404).json({ message: "Invalid target id!" });

	if (userId === targetId) return res.status(404).json({ message: "Invalid target id!" });

	const user = await User.findOne({ username: req.username });
	const targetUser = await User.findById(targetId);

	const index = user.following.findIndex(id => {
		return id.toString() === String(targetId);
	});

	if (index === -1) {
		user.following.push(targetId); // Follow
		targetUser.followers.push(userId);
	} else {
		user.following = user.following.filter(id => id.toString() !== String(targetId)); // Unfollow
		targetUser.followers = targetUser.followers.filter(id => id.toString() !== String(userId));
	}

	// Update user that send req
	const updatedUser = await User.findOneAndUpdate(
		{ username: req.username },
		{ following: user.following },
		{ new: true } // show the new version of post
	);

	// Update target user
	const updatedTargetUser = await User.findByIdAndUpdate(
		targetId,
		{
			followers: targetUser.followers
		},
		{ new: true }
	);

	res
		.status(200)
		.json({ following: updatedUser.following, followers: updatedTargetUser.followers });
};

module.exports.userFollowing = async (req, res) => {
	const { username } = req.params;
	const { username: usernameQuery = "", current = 0 } = req.query;
	const LIMIT = 20;

	const selectedUser = await User.findOne({ username });
	const totalFollowing = selectedUser.following.length;
	const hasMore = totalFollowing > current + LIMIT;

	// Build query up
	const usernameRegex = new RegExp(usernameQuery || "(.*?)", "i");

	const user = await User.findOne(
		{ username },
		{ following: { $slice: [Number(current), LIMIT] } }
	).populate({
		path: "following",
		select: "userId username posts profilePicture",
		match: {
			username: usernameRegex
		}
	});

	if (!user) return res.status(404).json({ message: "User not found!" });

	const structuredFollowingData = user.following.map(follow => ({
		userId: follow._id,
		username: follow.username,
		posts: follow.posts.length,
		profilePicture: follow.profilePicture
	}));

	return res.json({ following: structuredFollowingData, hasMore });
};

module.exports.userFollowers = async (req, res) => {
	const { username } = req.params;
	const { username: usernameQuery = "", current = 0 } = req.query;
	const LIMIT = 20;

	const selectedUser = await User.findOne({ username });
	const totalFollowers = selectedUser.followers.length;
	const hasMore = totalFollowers > current + LIMIT;

	// Build query up
	const usernameRegex = new RegExp(usernameQuery || "(.*?)", "i");

	const user = await User.findOne(
		{ username },
		{ followers: { $slice: [Number(current), LIMIT] } }
	).populate({
		path: "followers",
		select: "userId username posts profilePicture",
		match: {
			username: usernameRegex
		}
	});

	if (!user) return res.status(404).json({ message: "User not found!" });

	const structuredFollowersData = user.followers.map(follow => ({
		userId: follow._id,
		username: follow.username,
		posts: follow.posts.length,
		profilePicture: follow.profilePicture
	}));

	return res.json({ followers: structuredFollowersData, hasMore });
};

module.exports.topUser = async (req, res) => {
	const username = req.username;
	const users = await User.find({ isEmailVerified: true, username: { $ne: username } })
		.sort({ followers: -1 })
		.limit(4);

	const topUser = users.map(user => ({
		username: user.username,
		userId: user._id,
		followers: user.followers.length,
		profilePicture: user.profilePicture
	}));

	return res.status(200).json(topUser);
};

module.exports.userNotifications = async (req, res) => {
	const { current = 0 } = req.query;
	const LIMIT = 10;
	const username = req.username;

	if (!username) {
		return res.status(401).json({ message: "Not authorized" });
	}

	const user = await User.aggregate([
		{
			$match: {
				username
			}
		},
		{
			$unwind: {
				path: "$notifications"
			}
		},
		{
			$sort: {
				notifications: -1
			}
		},
		{
			$group: {
				_id: "$_id",
				notifications: {
					$push: "$notifications"
				}
			}
		},
		{
			$project: {
				notifications: {
					$slice: ["$notifications", Number(current), LIMIT]
				}
			}
		}
	]);

	const updatedNotifications = await User.findOneAndUpdate(
		{ username },
		{ $set: { "notifications.$[].read": true } },
		{ new: true }
	);

	const selectedUser = await User.findOne({ username });
	const hasMore = selectedUser.notifications.length > current + LIMIT;

	return res.status(200).json({ notifications: user[0].notifications, hasMore });
};

module.exports.reportUser = async (req, res) => {
	const { userId, username } = req;
	const { username: reportedUsername } = req.params;
	const { description, code } = req.body;

	const cleanedCode = sanitizeHTML(code);
	const cleanedDescription = sanitizeHTML(description);
	const cleanedUsername = sanitizeHTML(reportedUsername);

	const reportReasons = [
		{ text: "Konten tidak pantas", code: "001" },
		{ text: "Melakukan spam", code: "002" },
		{ text: "Akun palsu", code: "003" },
		{ text: "Alasan lainnya", code: "004" }
	];

	const isFound = reportReasons.filter(reason => reason.code === cleanedCode);
	if (isFound.length === 0) {
		return res.status(404).json({ message: "Report code not found!" });
	}

	const selectedUser = await User.find({ username: cleanedUsername });

	if (!selectedUser) {
		return res.status(404).json({ messaeg: "User not found!" });
	}

	if (selectedUser._id === userId) {
		return res.status(401).json({ message: "You're not allowed to do that!" });
	}

	const newReport = new ReportUser({
		issuedBy: userId,
		userId: selectedUser._id,
		reasonCode: isFound[0].code,
		reasonText: isFound[0].text,
		description: cleanedDescription
	});

	await newReport.save();

	return res.status(200).json({ message: "Thank you for your report." });
};
