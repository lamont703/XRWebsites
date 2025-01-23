import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin, hasAdminRole } from "../middlewares/admin.middleware.js";
import { 
    promoteToAdmin, 
    revokeAdmin,
    getAdminDashboard,
    getAllUsers 
} from "../controllers/admin.controller.js";

const router = Router();

// All routes require both JWT and admin access
router.use(verifyJWT, isAdmin);

router.route("/dashboard").get(getAdminDashboard);
router.route("/users").get(getAllUsers);
router.route("/users/:id/promote").post(hasAdminRole('super'), promoteToAdmin);
router.route("/users/:id/revoke").post(hasAdminRole('super'), revokeAdmin);

export default router; 