// Dependencies
const sharp = require("sharp");
const fs = require("fs");

const compressImage = async (image, username) => {
	// Compress image
	await sharp(image)
		.resize(400)
		.webp({ quality: 100 })
		.toFile(`/tmp/${username}.webp`)
		.then(data => fs.unlinkSync(image)) // Delete old not compressed image
		.catch(error => console.log(error.message));
};

module.exports = compressImage;
