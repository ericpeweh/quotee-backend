// Models
import Notification from "../models/notification.js";
import User from "../models/user.js";

export const subscribeNotifications = async (req, res) => {
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

export const unsubscribeNotifications = async (req, res) => {
	const userId = req.userId;

	try {
		await Notification.deleteMany({ userId });
		await User.findByIdAndUpdate(userId, { allowNotifications: false });

		res.status(200).json("Unsubscribed successfully!");
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
