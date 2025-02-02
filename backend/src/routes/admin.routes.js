import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin, hasAdminRole } from "../middlewares/admin.middleware.js";
import { 
    promoteToAdmin, 
    revokeAdmin,
    getAdminDashboard,
    getAllUsers,
    getSystemStats,
    getAdminLogs,
    updateAdminSettings
} from "../controllers/admin.controller.js";

const router = Router();

// Base middleware - all routes require JWT
router.use(verifyJWT);

// Dashboard and basic admin routes - requires any admin role
router.use(isAdmin);
router.route("/dashboard").get(getAdminDashboard);
router.route("/users").get(getAllUsers);
router.route("/stats").get(getSystemStats);

// Super admin only routes
router.use("/super", hasAdminRole('super'));
router.route("/super/users/:id/promote").post(promoteToAdmin);
router.route("/super/users/:id/revoke").post(revokeAdmin);
router.route("/super/logs").get(getAdminLogs);
router.route("/super/settings").patch(updateAdminSettings);

export default router; 