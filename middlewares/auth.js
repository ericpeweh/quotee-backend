// Dependencies
import jwt from "jsonwebtoken";

export const isAuth = (req, res, next) => {
	const token = req.cookies?.jwt;

	try {
		const authenticated = jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
			if (error) {
				throw { message: "You're not authorized." };
			}

			return decoded;
		});

		if (authenticated) {
			req.userId = authenticated.userId;
			req.username = authenticated.username;
			return next();
		}
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
};
