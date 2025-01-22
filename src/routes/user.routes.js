import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload, handleFileCleanup } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { 
            name: "avatar", 
            maxCount: 1 
        },
        { 
            name: "coverImage", 
            maxCount: 1 
        },
    ]),
    handleFileCleanup,
    registerUser
);

export default router;