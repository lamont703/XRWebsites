import { Router } from 'express';
import { uploadMetadata } from '../controllers/metadata.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/upload").post(verifyJWT, uploadMetadata);

export default router; 