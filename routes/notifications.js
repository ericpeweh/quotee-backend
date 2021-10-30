// Dependencies
const express = require("express");

// Contollers
const subscribeNotifications = require("../controllers/notifications.js").subscribeNotifications;
const unsubscribeNotifications =
	require("../controllers/notifications.js").unsubscribeNotifications;

// Middlewares
const isAuth = require("../middlewares/auth.js").isAuth;

// Express router
const router = express.Router();

// Access controllers
router.post("/subscribe", isAuth, subscribeNotifications);
router.post("/unsubscribe", isAuth, unsubscribeNotifications);

module.exports = router;
