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
import Wallet from "../models/wallet.models.js";
import NFTAsset from "../models/nftAsset.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

router.post('/wallet/:walletId/nfts/create', verifyJWT, async (req, res) => {
  try {
    const { walletId } = req.params;
    const nftData = req.body;

    // Validate wallet ownership
    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to create NFT for this wallet' });
    }

    // Create NFT using the model
    const nft = await NFTAsset.create({
      ...nftData,
      owner_wallet_id: walletId,
      creator_id: req.user.id,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'NFT created successfully',
      data: nft
    });
  } catch (error) {
    console.error('Error creating NFT:', error);
    res.status(500).json({ message: 'Error creating NFT' });
  }
});

router.post('/wallet/:walletId/nfts/:nftId/list', verifyJWT, async (req, res) => {
  try {
    const { walletId, nftId } = req.params;
    const { price, duration } = req.body;

    // Validate wallet ownership
    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.user_id !== req.user.id) {
      throw new ApiError(403, "Unauthorized to list NFTs from this wallet");
    }

    // Create listing using NFTAsset model
    const listing = await NFTAsset.createListing(nftId, {
      seller_wallet_id: walletId,
      price: parseFloat(price),
      duration: parseInt(duration),
      status: 'active',
      created_by: req.user.id
    });

    // Record transaction
    await Wallet.recordTransaction(walletId, "nft_list", 0, {
      nft_id: nftId,
      listing_id: listing.id,
      price: price,
      status: "listed"
    });

    res.status(201).json(new ApiResponse(201, "NFT listed successfully", listing));
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message || "Failed to list NFT");
  }
});

export default router; 