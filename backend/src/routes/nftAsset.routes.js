import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
    getAllNFTAssets,
    createNFTAsset,
    getNFTAssetById,
    transferNFT,
    updateNFTAssetMetadata,
    createNFTAssetReview,
    deleteNFTAsset,
    getNFTAssetReviews,
    tokenizeNFTAsset
} from "../controllers/nftAsset.controller.js";

const router = Router();

// Public routes
router.route("/").get(getAllNFTAssets);
router.route("/:id").get(getNFTAssetById);
router.route("/:id/reviews").get(getNFTAssetReviews);

// Protected routes
router.use(verifyJWT);

router.route("/").post(
    upload.fields([{ name: "image", maxCount: 1 }]),
    createNFTAsset
);

router.route("/:id")
    .delete(deleteNFTAsset);
    
router.route("/:id/transfer").post(transferNFT);
router.route("/:id/metadata").put(updateNFTAssetMetadata);
router.route("/:id/reviews").post(createNFTAssetReview);
router.route("/:id/tokenize").post(tokenizeNFTAsset);

export default router; 