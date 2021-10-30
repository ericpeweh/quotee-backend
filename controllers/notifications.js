// Models
const Notification = require("../models/notification.js");
const User = require("../models/user.js");

module.exports.subscribeNotifications = async (req, res) => {
	const { userId } = req;
	const subscription = req.body;

	try {
		await Notification.deleteMany({ userId });
		await Notification.create({
			userId,
			subscription
		});

		await User.findByIdAndUpdate(userId, { allowNotifications: true });

		res.status(200).json("Subscribed successfully!");
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

module.exports.unsubscribeNotifications = async (req, res) => {
	const userId = req.userId;

	try {
		await Notification.deleteMany({ userId });
		await User.findByIdAndUpdate(userId, { allowNotifications: false });

		res.status(200).json("Unsubscribed successfully!");
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
