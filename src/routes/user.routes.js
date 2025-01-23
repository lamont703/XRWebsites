import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    getUserDashboard,
    getCurrentUser,
    updateUserProfile,
    getUserProfile,
    deleteUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload, handleFileCleanup } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    handleFileCleanup,
    registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").post(verifyJWT, logoutUser);

// Protected routes
router.route("/dashboard").get(verifyJWT, getUserDashboard);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/:id/profile").get(getUserProfile);

router.route("/:id/update").put(
    verifyJWT,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    handleFileCleanup,
    updateUserProfile
);

router.route("/:id/delete").delete(
    verifyJWT,
    deleteUser
);

export default router;