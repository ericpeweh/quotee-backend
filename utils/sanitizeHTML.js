// Dependencies
import sanitizeHtml from "sanitize-html";

export const sanitizeHTML = data => {
	const clean = sanitizeHtml(data, {
		allowedTags: [],
		allowedAttributes: {},
		allowedIframeHostnames: []
	});
	return clean;
};
