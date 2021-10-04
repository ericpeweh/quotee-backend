// Dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";

// Router
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import articleRoutes from "./routes/articles.js";
import notificationsRoutes from "./routes/notifications.js";

// Schedule
import qotdTask from "./schedule/qotd.js";

// App Config
const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;

// Body parser & cors-policy & cookie parser
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "30mb", extended: "true" }));
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
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

// Base URL
app.get("/", (req, res) => {
	res.send("Quotee App");
});

// Schedule
qotdTask.start();

// Connect to MongoDB
mongoose
	.connect(process.env.DB_URL)
	.then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
	.catch(error => console.log(error));
