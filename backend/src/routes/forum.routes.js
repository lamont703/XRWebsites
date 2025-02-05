import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    getPosts,
    createPost,
    getPostById,
    togglePostLike,
    createComment,
    getCategories
} from '../controllers/forum.controller.js';

const router = express.Router();

router.get('/posts', verifyJWT, getPosts);
router.post('/posts', verifyJWT, createPost);
router.get('/posts/:id', verifyJWT, getPostById);
router.post('/posts/:id/like', verifyJWT, togglePostLike);
router.post('/posts/:id/comments', verifyJWT, createComment);
router.get('/categories', verifyJWT, getCategories);

export default router; 