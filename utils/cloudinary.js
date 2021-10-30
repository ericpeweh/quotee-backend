// Dependencies
const cloudinary = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET,
	secure: true
});

module.exports = cloudinary.v2;
