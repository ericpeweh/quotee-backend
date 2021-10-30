// Dependencies
const jwt = require("jsonwebtoken");

// Models
const User = require("../models/user.js");

module.exports.isAuth = async (req, res, next) => {
	const token = req.cookies?.jwt;

	try {
		const authenticated = jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
			if (error) {
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
