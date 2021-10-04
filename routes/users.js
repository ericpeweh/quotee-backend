// Dependencies
import express from "express";
import multer from "multer";

// Middlewares
import { isAuth } from "../middlewares/auth.js";

// Multer
const upload = multer({ dest: "uploads/" });

// Controllers
import {
	signUp,
	verifyEmail,
	signIn,
	signOut,
	auth,
	userSuggestion,
	topUser,
	userProfile,
	userPosts,
	userFavorites,
	userArchived,
	userSettings,
	changePassword,
	resetPassword,
	verifyResetPassword,
	updateProfile,
	changeProfilePicture,
	deleteProfilePicture,
	followUser,
	userFollowing,
	userFollowers,
	userNotifications
} from "../controllers/users.js";

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

export default router;
