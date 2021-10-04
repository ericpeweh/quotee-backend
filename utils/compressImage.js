// Dependencies
import sharp from "sharp";
import fs from "fs";

const compressImage = async (image, username) => {
	// Compress image
	await sharp(image)
		.resize(400)
		.webp({ quality: 100 })
		.toFile(`uploads/${username}.webp`)
		.then(data => fs.unlinkSync(image)) // Delete old not compressed image
		.catch(error => console.log(error.message));
};

export default compressImage;