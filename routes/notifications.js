// Dependencies
import express from "express";

// Contollers
import { subscribeNotifications, unsubscribeNotifications } from "../controllers/notifications.js";

// Middlewares
import { isAuth } from "../middlewares/auth.js";

// Express router
const router = express.Router();

// Access controllers
router.post("/subscribe", isAuth, subscribeNotifications);
router.post("/unsubscribe", isAuth, unsubscribeNotifications);

export default router;
