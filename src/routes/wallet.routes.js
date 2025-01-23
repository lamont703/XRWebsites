import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getWallet,
    createWallet,
    connectExternalWallet,
    depositTokens,
    withdrawTokens,
    transferTokens,
    getTransactionHistory
} from "../controllers/wallet.controller.js";

const router = Router();

router.route("/:id").get(verifyJWT, getWallet);
router.route("/").post(verifyJWT, createWallet);
router.route("/:id/connect").post(verifyJWT, connectExternalWallet);
router.route("/:id/deposit").post(verifyJWT, depositTokens);
router.route("/:id/withdraw").post(verifyJWT, withdrawTokens);
router.route("/:id/transfer").post(verifyJWT, transferTokens);
router.route("/:id/transactions").get(verifyJWT, getTransactionHistory);

export default router; 