import express from 'express';
import { completeOnboarding } from '../controllers/onboarding.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/complete', verifyJWT, completeOnboarding);

export default router; 