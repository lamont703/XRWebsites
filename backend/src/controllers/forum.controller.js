import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Forum from "../models/forum.models.js";
import { getContainer } from "../database.js";

const getPosts = asyncHandler(async (req, res) => {
    const { category, sort = 'latest', search, page = 1, limit = 10 } = req.query;
    const posts = await Forum.findPosts({ category, search }, sort, page, limit);
    
    return res.status(200).json(
        new ApiResponse(200, "Posts retrieved successfully", {
            posts,
            page: Number(page),
            totalPages: Math.ceil(posts.length / limit),
            totalPosts: posts.length
        })
    );
});

const createPost = asyncHandler(async (req, res) => {
    const { title, content, category, tags } = req.body;

    if (!title || !content || !category) {
        throw new ApiError(400, "Title, content, and category are required");
    }

    // Get full user data from database
    const container = await getContainer();
    const querySpec = {
        query: "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id",
        parameters: [{ name: '@id', value: req.user.id }]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    const userData = resources[0];

    if (!userData) {
        throw new ApiError(404, "User not found");
    }

    const post = await Forum.createPost({
        title,
        content,
        category,
        tags: tags || [],
        author: {
            id: userData.id,
            name: userData.fullName,
            username: userData.username,
            avatar: userData.avatar
        }
    });

    return res.status(201).json(
        new ApiResponse(201, "Post created successfully", post)
    );
});

const getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const container = await getContainer();
    
    try {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'forum_post'",
            parameters: [{ name: '@id', value: id }]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        const post = resources[0];
        
        if (!post) {
            throw new ApiError(404, "Post not found");
        }

        // Fetch all comments for this post
        const commentQuerySpec = {
            query: "SELECT * FROM c WHERE c.type = 'forum_comment' AND c.postId = @postId",
            parameters: [{ name: '@postId', value: id }]
        };
        
        const { resources: allComments } = await container.items.query(commentQuerySpec).fetchAll();
        
        // Organize comments into a tree structure
        const commentMap = new Map();
        const topLevelComments = [];

        // First pass: create map of all comments
        allComments.forEach(comment => {
            if (comment.status !== 'deleted') {  // Only add non-deleted comments
                comment.replies = [];
                commentMap.set(comment.id, comment);
            }
        });

        // Second pass: organize into tree structure
        allComments.forEach(comment => {
            if (comment.status !== 'deleted') {  // Only process non-deleted comments
                if (comment.parentId && commentMap.has(comment.parentId)) {
                    // This is a reply - add it to parent's replies
                    const parentComment = commentMap.get(comment.parentId);
                    parentComment.replies.push(comment);
                } else {
                    // This is a top-level comment
                    topLevelComments.push(comment);
                }
            }
        });

        const response = new ApiResponse(200, "Post retrieved successfully", { 
            ...post, 
            comments: topLevelComments 
        });
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in getPostById:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to retrieve post");
    }
});

const togglePostLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await Forum.toggleLike(id, req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, "Post like updated successfully", result)
    );
});

const createComment = asyncHandler(async (req, res) => {
    const { id: postId } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    // Verify post exists using query
    const container = await getContainer();
    const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'forum_post'",
        parameters: [{ name: '@id', value: postId }]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    const post = resources[0];
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const comment = await Forum.createComment({
        postId,
        parentId,
        content,
        author: {
            id: req.user.id,
            name: req.user.fullName,
            username: req.user.username,
            avatar: req.user.avatar
        }
    });

    // Update post reply count
    try {
        post.replies = (typeof post.replies === 'number' ? post.replies : 0) + 1;
        post.updatedAt = new Date().toISOString();
        await container.items.upsert(post, { partitionKey: post.type });
    } catch (error) {
        console.error("Error updating post reply count:", error);
    }

    return res.status(201).json(
        new ApiResponse(201, "Comment created successfully", comment)
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await Forum.toggleLike(id, req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, "Comment like updated successfully", result)
    );
});

const getCategories = asyncHandler(async (req, res) => {
    const categories = await Forum.getCategories();
    return res.status(200).json(
        new ApiResponse(200, "Categories retrieved successfully", categories)
    );
});

const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await Forum.softDeletePost(id, req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, "Post deleted successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await Forum.softDeleteComment(id, req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, "Comment deleted successfully")
    );
});

const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await Forum.toggleLike(id, req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, "Like status updated successfully", result)
    );
});

const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const container = await getContainer();

    const querySpec = {
        query: `
            SELECT * FROM c 
            WHERE c.type = 'forum_post' 
            AND c.author.id = @userId 
            AND (NOT IS_DEFINED(c.status) OR c.status != 'deleted')
            ORDER BY c.createdAt DESC
        `,
        parameters: [
            { name: "@userId", value: userId }
        ]
    };

    try {
        const { resources: posts } = await container.items.query(querySpec).fetchAll();
        
        res.json(
            new ApiResponse(200, "User posts retrieved successfully", {
                posts: posts || []
            })
        );
    } catch (error) {
        console.error("Error fetching user posts:", error);
        throw new ApiError(500, "Failed to fetch user posts");
    }
});

export {
    getPosts,
    createPost,
    getPostById,
    togglePostLike,
    createComment,
    toggleCommentLike,
    getCategories,
    deletePost,
    deleteComment,
    toggleLike,
    getUserPosts
};