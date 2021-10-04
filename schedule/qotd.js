// Dependencies
import cron from "node-cron";
import webpush from "web-push";

// Models
import Notification from "../models/notification.js";
import Quotes from "../models/quotes.js";
import User from "../models/user.js";

const task = cron.schedule("59 11 * * *", () => {
	// Send quotes of the day everyday 12.00
	sendQOTD().then(console.log("Quotes of the day sent!"));
	console.log("Task run");
});

const sendQOTD = async () => {
	try {
		webpush.setVapidDetails(
			"mailto:quoteequotesid.gmail.com",
			process.env.PUBLIC_KEY,
			process.env.PRIVATE_KEY
		);

		const numberOfPosts = await Quotes.countDocuments({});
		const randomNumber = Math.floor(Math.random() * numberOfPosts);
		const quotes = await Quotes.findOne().skip(randomNumber).populate("authorId", "profilePicture");

		const notifications = await Notification.find({});
		const payload = JSON.stringify({
			body: `${quotes.quotes} - ${quotes.author}`,
			title: "Quotes of the day",
			url: `https://quoteeid.netlify.app/${quotes.author}/p/${quotes._id}`
		});

		notifications.map((user, index) => {
			webpush
				.sendNotification(user.subscription, payload)
				.then(async () => {
					const newNotification = {
						announcer: "Quotee.id",
						name: "Quotes of the day",
						description: `${quotes.quotes} - ${quotes.author}`,
						profilePicture: quotes.authorId.profilePicture,
						url: `https://quoteeid.netlify.app/${quotes.author}/p/${quotes._id}`
					};

					await User.findByIdAndUpdate(notifications[index].userId, {
						$push: { notifications: newNotification }
					});
				})
				.catch(async err => {
					if (err.statusCode === 404 || err.statusCode === 410) {
						console.log("Subscription has expired or is no longer valid");
						await Notification.findByIdAndDelete(notifications[index]._id);
					} else {
						throw err;
					}
				});
		});
	} catch (error) {
		throw error;
	}
};

export default task;
