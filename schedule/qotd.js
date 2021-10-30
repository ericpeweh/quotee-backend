// Dependencies
const cron = require("node-cron");
const webpush = require("web-push");

// Models
const Notification = require("../models/notification.js");
const Quotes = require("../models/quotes.js");
const User = require("../models/user.js");

const task = cron.schedule("59 11 * * *", () => {
	// Send quotes of the day everyday 12.00
	sendQOTD().then(console.log("Quotes of the day sent!"));
});

const sendQOTD = async () => {
	try {
		webpush.setVapidDetails(
			"mailto:quoteequotesid.gmail.com",
			process.env.PUBLIC_KEY,
			process.env.PRIVATE_KEY
		);

		const numberOfPosts = await Quotes.countDocuments({ qotd: false });
		const randomNumber = Math.floor(Math.random() * numberOfPosts);
		const quotes = await Quotes.findOne({ qotd: false })
			.skip(randomNumber)
			.populate("authorId", "profilePicture");

		if (!quotes) return;

		const notifications = await Notification.find({});
		const payload = JSON.stringify({
			body: `${quotes.quotes} - ${quotes.author}`,
			title: "Quotes of the day",
			url: `https://www.quoteequotes.xyz/${quotes.author}/p/${quotes._id}`
		});

		const newNotification = {
			announcer: "Quotee",
			name: "Quotes of the day",
			description: `${quotes.quotes} - ${quotes.author}`,
			profilePicture: quotes.authorId.profilePicture,
			url: `https://www.quoteequotes.xyz/${quotes.author}/p/${quotes._id}`
		};

		notifications.map((user, index) => {
			webpush.sendNotification(user.subscription, payload).catch(async err => {
				if (err.statusCode === 404 || err.statusCode === 410) {
					console.log("Subscription has expired or is no longer valid");
					await Notification.findByIdAndDelete(notifications[index]._id);
				} else {
					throw err;
				}
			});
		});

		await User.updateMany(
			{ isEmailVerified: true },
			{
				$push: { notifications: newNotification }
			}
		);

		await Quotes.findByIdAndUpdate(quotes._id, { qotd: true });
	} catch (error) {
		throw error;
	}
};

module.exports = task;
