// Dependencies
const sanitizeHtml = require("sanitize-html");

module.exports.sanitizeHTML = data => {
	const clean = sanitizeHtml(data, {
		allowedTags: [],
		allowedAttributes: {},
		allowedIframeHostnames: []
	});
	return clean;
};
