// Dependencies
const jwt = require("jsonwebtoken");

// Models
const User = require("../models/user.js");

module.exports.isAuth = async (req, res, next) => {
	if (!req.headers.authorization) {
		throw { message: "You're not authorized." };
	}
	const token = req.headers.authorization?.split(" ")[1];

	try {
		const authenticated = jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
			if (error) {
				if (error.message === "jwt expired") {
					throw { message: "Expired" };
				}
				throw { message: "You're not authorized." };
			}

			return decoded;
		});

		const user = await User.findById(authenticated.userId);
		if (!user) throw { message: "User not found to authenticate!" };
		if (user.isEmailVerified === false) throw { message: "User is not verified!" };

		if (authenticated) {
			req.userId = authenticated.userId;
			req.username = authenticated.username;
			return next();
		}
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
};
