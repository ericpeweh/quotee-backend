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
	const { query, current } = req.query;
	let totalImages = 0;
	let limitError = false;
	let hasMore = true;
	let result = [];

	if (Number(current) >= 150) {
		res.status(201).json({ images: [], hasMore: false });
	}

	const page = Math.ceil(Number(current) / 30) + 1;

	const URL = query
		? `/search/photos?query=${query}&page=${page}&per_page=30`
		: `/photos/random?count=30`;

	// 1st TRY
	try {
		const res = await UNSPLASH1.get(URL);

		totalImages = res.data.total;

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

			totalImages = res.data.total;

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

			totalImages = res.data.total;

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

			totalImages = res.data.total;

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

	if (totalImages === Number(current)) hasMore = false;
	if (totalImages < 30) hasMore = false;

	if (limitError) return res.status(400).json({ message: "Image limit exceeded" });

	if (!limitError) {
		const structuredImages = query
			? result.results.map(image => ({
					_id: image.id,
					thumb: image.urls.thumb,
					regular: image.urls.regular,
					userLink: image.user.links.html,
					username: image.user.name,
					width: image.width,
					height: image.height
			  }))
			: result.map(image => ({
					_id: image.id,
					thumb: image.urls.thumb,
					regular: image.urls.regular,
					userLink: image.user.links.html,
					username: image.user.name,
					width: image.width,
					height: image.height
			  }));

		res.status(201).json({ images: structuredImages, hasMore });
	}
};
