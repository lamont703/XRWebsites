import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { getMessages, sendMessage } from '../controllers/message.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/:userId', verifyJWT, asyncHandler(getMessages));
router.post('/:userId', verifyJWT, asyncHandler(sendMessage));

export default router; 