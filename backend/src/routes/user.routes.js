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
import { verifyJWT } from "../middleware/auth.middleware.js";


const router = Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyJWT, logoutUser);

// Protected routes
router.get("/dashboard", verifyJWT, getUserDashboard);
router.route("/me").get(verifyJWT, getCurrentUser);
router.get("/:id/profile", getUserProfile);
router.put("/:id/update", verifyJWT, updateUserProfile);
router.delete("/:id/delete", verifyJWT, deleteUser);

export default router;