import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    getPosts,
    createPost,
    getPostById,
    togglePostLike,
    createComment,
    getCategories,
    toggleCommentLike,
    deletePost,
    deleteComment,
    getUserPosts
} from '../controllers/forum.controller.js';

const router = express.Router();

router.get('/posts', verifyJWT, getPosts);
router.post('/posts', verifyJWT, createPost);
router.get('/posts/:id', verifyJWT, getPostById);
router.post('/posts/:id/like', verifyJWT, togglePostLike);
router.post('/comments/:id/like', verifyJWT, toggleCommentLike);
router.delete('/posts/:id', verifyJWT, deletePost);
router.delete('/comments/:id', verifyJWT, deleteComment);
router.get('/categories', verifyJWT, getCategories);
router.post('/posts/:id/comments', verifyJWT, createComment);
router.get('/users/:userId/posts', verifyJWT, getUserPosts);

export default router; 