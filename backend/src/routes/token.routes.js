import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    createToken,
    getTokens,
    getTokenByMint,
    updateToken,
    deleteToken
} from '../controllers/token.controller.js';

const router = Router();

router.use(verifyJWT); // Protect all token routes

router.route('/')
    .post(createToken)
    .get(getTokens);

router.route('/:mint')
    .get(getTokenByMint)
    .patch(updateToken)
    .delete(deleteToken);

export default router; 