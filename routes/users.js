// Dependencies
const express = require("express");
const multer = require("multer");

// Middlewares
const isAuth = require("../middlewares/auth.js").isAuth;

// Multer
const upload = multer({ dest: "/tmp" });

// Controllers
const signUp = require("../controllers/users.js").signUp;
const verifyEmail = require("../controllers/users.js").verifyEmail;
const signIn = require("../controllers/users.js").signIn;
const signOut = require("../controllers/users.js").signOut;
const auth = require("../controllers/users.js").auth;
const userSuggestion = require("../controllers/users.js").userSuggestion;
const topUser = require("../controllers/users.js").topUser;
const userProfile = require("../controllers/users.js").userProfile;
const userPosts = require("../controllers/users.js").userPosts;
const userFavorites = require("../controllers/users.js").userFavorites;
const userArchived = require("../controllers/users.js").userArchived;
const userSettings = require("../controllers/users.js").userSettings;
const changePassword = require("../controllers/users.js").changePassword;
const resetPassword = require("../controllers/users.js").resetPassword;
const verifyResetPassword = require("../controllers/users.js").verifyResetPassword;
const updateProfile = require("../controllers/users.js").updateProfile;
const changeProfilePicture = require("../controllers/users.js").changeProfilePicture;
const deleteProfilePicture = require("../controllers/users.js").deleteProfilePicture;
const followUser = require("../controllers/users.js").followUser;
const userFollowing = require("../controllers/users.js").userFollowing;
const userFollowers = require("../controllers/users.js").userFollowers;
const userNotifications = require("../controllers/users.js").userNotifications;
const reportUser = require("../controllers/users.js").reportUser;

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.post("/verifyEmail", verifyEmail);
router.post("/verifyResetPassword", verifyResetPassword);
router.post("/changePassword", isAuth, changePassword);
router.post("/resetPassword", resetPassword);
router.post("/updateProfile", isAuth, updateProfile);
router.post("/changeProfilePicture", isAuth, upload.single("profilePicture"), changeProfilePicture);
router.post("/deleteProfilePicture", isAuth, deleteProfilePicture);
router.patch("/:targetId/follow", isAuth, followUser);
router.get("/auth", auth);
router.get("/usersuggestion", isAuth, userSuggestion);
router.get("/topuser", isAuth, topUser);
router.get("/n", isAuth, userNotifications);
router.get("/:username/p", isAuth, userPosts);
router.get("/:username/f", isAuth, userFavorites);
router.get("/:username/a", isAuth, userArchived);
router.get("/:username/s", isAuth, userSettings);
router.get("/:username/following", isAuth, userFollowing);
router.get("/:username/followers", isAuth, userFollowers);
router.get("/:username", isAuth, userProfile);
router.post("/:username/report", isAuth, reportUser);

module.exports = router;
