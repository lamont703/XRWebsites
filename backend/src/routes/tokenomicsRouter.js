import express from 'express';
import { tokenomicsController } from '../controllers/tokenomics.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get token metrics
router.get('/metrics/:tokenId', verifyJWT, tokenomicsController.getTokenMetrics);

// Get historical price data
router.get('/price-history/:tokenId', verifyJWT, tokenomicsController.getPriceHistory);

// Get holder statistics
router.get('/holders/:tokenId', verifyJWT, tokenomicsController.getHolderStats);

// Get distribution data
router.get('/distribution/:tokenId', verifyJWT, tokenomicsController.getDistribution);

export default router; 