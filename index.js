// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
// const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

// Router
const postRoutes = require("./routes/posts.js");
const userRoutes = require("./routes/users.js");
const articleRoutes = require("./routes/articles.js");
const notificationsRoutes = require("./routes/notifications.js");
const apiRoutes = require("./routes/api.js");

// Schedule
const qotdTask = require("./schedule/qotd.js");

// App Config
const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;

// Body parser & cors-policy & cookie parser
app.use(
	cors({
		credentials: true,
		origin: [
			"https://www.quoteequotes.xyz",
			"https://quoteequotes.xyz",
			"www.quoteequotes.xyz",
			"quoteequotes.xyz",
			"https://103.247.9.250"
			// "http://localhost:3000"
		]
	})
);

app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "30mb", extended: "true" }));

// app.use(cookieParser());
app.use(helmet());
app.use(
	mongoSanitize({
		onSanitize: ({ req, key }) => {
			console.warn(`This request[${key}] is sanitized`, req);
		}
	})
);

// Routes
app.use("/p", postRoutes);
app.use("/u", userRoutes);
app.use("/a", articleRoutes);
app.use("/n", notificationsRoutes);
app.use("/api", apiRoutes);

// Base URL
app.get("/", (req, res) => {
	res.send("Quotee API");
});

// Schedule
qotdTask.start();

// Connect to MongoDB
mongoose
	.connect(process.env.DB_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
	.catch(error => console.log(error));

module.exports = app;
