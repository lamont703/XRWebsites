import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getWallet,
    createWallet,
    connectExternalWallet,
    depositTokens,
    withdrawTokens,
    transferTokens,
    getTransactionHistory,
    transferNFT,
    getNFTs,
    createNFT,
    updateWalletBalance,
    getRecentTransactions
} from "../controllers/wallet.controller.js";

const router = Router();


router.route("/").get(verifyJWT, getWallet);
router.route("/me/wallet").get(verifyJWT, getWallet);
router.route("/wallet").get(verifyJWT, getWallet);
router.route("/wallet").post(verifyJWT, createWallet);
router.route("/wallet/:id/connect").post(verifyJWT, connectExternalWallet);
router.route("/wallet/:id/deposit").post(verifyJWT, depositTokens);
router.route("/wallet/:id/withdraw").post(verifyJWT, withdrawTokens);
router.route("/wallet/:id/transfer").post(verifyJWT, transferTokens);
router.route("/wallet/:id/transactions").get(verifyJWT, getTransactionHistory);

router.route("/wallet/:id/nfts/transfer").post(verifyJWT, transferNFT);
router.route("/wallet/:id/nfts").get(verifyJWT, getNFTs);
router.route("/wallet/:id/nfts/create").post(verifyJWT, createNFT);

router.get("/:id", verifyJWT, getWallet);
router.put("/:id/balance", verifyJWT, updateWalletBalance);

router.route("/wallet/:id/recent-transactions").get(verifyJWT, getRecentTransactions);

export default router; 