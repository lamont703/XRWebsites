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
            comment.replies = [];
            commentMap.set(comment.id, comment);
        });

        // Second pass: organize into tree structure
        allComments.forEach(comment => {
            if (comment.parentId && commentMap.has(comment.parentId)) {
                // This is a reply - add it to parent's replies
                const parentComment = commentMap.get(comment.parentId);
                parentComment.replies.push(comment);
            } else {
                // This is a top-level comment
                topLevelComments.push(comment);
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
    const container = await getContainer();
    const { resource: post } = await container.item(id).read();

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const userLikeIndex = post.likedBy?.indexOf(req.user.id) ?? -1;
    if (userLikeIndex === -1) {
        post.likedBy = [...(post.likedBy || []), req.user.id];
        post.likes += 1;
    } else {
        post.likedBy.splice(userLikeIndex, 1);
        post.likes -= 1;
    }

    post.updatedAt = new Date().toISOString();
    await container.item(id).replace(post);

    return res.status(200).json(
        new ApiResponse(200, "Post like updated successfully", {
            likes: post.likes,
            liked: userLikeIndex === -1
        })
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
    const container = await getContainer();
    const { resource: comment } = await container.item(id).read();

    if (!comment || comment.type !== 'forum_comment') {
        throw new ApiError(404, "Comment not found");
    }

    const userLikeIndex = comment.likedBy?.indexOf(req.user.id) ?? -1;
    if (userLikeIndex === -1) {
        comment.likedBy = [...(comment.likedBy || []), req.user.id];
        comment.likes += 1;
    } else {
        comment.likedBy.splice(userLikeIndex, 1);
        comment.likes -= 1;
    }

    await container.item(id).replace(comment);

    return res.status(200).json(
        new ApiResponse(200, "Comment like updated successfully", {
            likes: comment.likes,
            liked: userLikeIndex === -1
        })
    );
});

const getCategories = asyncHandler(async (req, res) => {
    const categories = await Forum.getCategories();
    return res.status(200).json(
        new ApiResponse(200, "Categories retrieved successfully", categories)
    );
});

export {
    getPosts,
    createPost,
    getPostById,
    togglePostLike,
    createComment,
    toggleCommentLike,
    getCategories
};