import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllAssets,
    createAsset,
    getAssetById,
    updateAsset,
    deleteAsset,
    tokenizeAsset,
    createAssetReview,
    getAssetReviews
} from "../controllers/asset.controller.js";

const router = Router();

// Public routes
router.route("/").get(getAllAssets);
router.route("/:id").get(getAssetById);
router.route("/:id/reviews").get(getAssetReviews);

// Protected routes
router.use(verifyJWT);
router.route("/").post(createAsset);
router.route("/:id")
    .put(updateAsset)
    .delete(deleteAsset);
router.route("/:id/tokenize").post(tokenizeAsset);
router.route("/:id/reviews").post(createAssetReview);

export default router; 