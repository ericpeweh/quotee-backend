// Dependencies
const axios = require("axios");

const UNSPLASH1 = axios.create({
	baseURL: "https://api.unsplash.com",
	headers: {
		Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY_1}`
	}
});
const UNSPLASH2 = axios.create({
	baseURL: "https://api.unsplash.com",
	headers: {
		Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY_2}`
	}
});
const UNSPLASH3 = axios.create({
	baseURL: "https://api.unsplash.com",
	headers: {
		Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY_3}`
	}
});
const UNSPLASH4 = axios.create({
	baseURL: "https://api.unsplash.com",
	headers: {
		Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY_4}`
	}
});

// GET /images
module.exports.getImages = async (req, res) => {
	const { query } = req.query;
	let limitError = false;
	let result = [];

	const URL = query ? `/photos/random?count=30&query=${query}` : "/photos/random?count=30";

	// 1st TRY
	try {
		const res = await UNSPLASH1.get(URL);
		result = res.data;
	} catch (err) {
		if (err.response.data === "Rate Limit Exceeded") {
			limitError = true;
		} else {
			return res.status(200).json({ images: [] });
		}
	}

	if (limitError) {
		// 2nd TRY
		try {
			const res = await UNSPLASH2.get(URL);
			result = res.data;
			limitError = false;
		} catch (err) {
			if (err.response.data === "Rate Limit Exceeded") {
				limitError = true;
			} else {
				return res.status(200).json({ images: [] });
			}
		}
	}

	if (limitError) {
		// 2rd TRY
		try {
			const res = await UNSPLASH3.get(URL);
			result = res.data;
			limitError = false;
		} catch (err) {
			if (err.response.data === "Rate Limit Exceeded") {
				limitError = true;
			} else {
				return res.status(200).json({ images: [] });
			}
		}
	}

	if (limitError) {
		// 4th TRY
		try {
			const res = await UNSPLASH4.get(URL);
			result = res.data;
			limitError = false;
		} catch (err) {
			if (err.response.data === "Rate Limit Exceeded") {
				limitError = true;
			} else {
				return res.status(200).json({ images: [] });
			}
		}
	}

	if (limitError) return res.status(400).json({ message: "Image limit exceeded" });

	if (!limitError) {
		const structuredImages = result.map(image => ({
			_id: image.id,
			thumb: image.urls.thumb,
			regular: image.urls.regular,
			userLink: image.user.links.html,
			username: image.user.name,
			width: image.width,
			height: image.height
		}));

		res.status(201).json({ images: structuredImages });
	}
};
