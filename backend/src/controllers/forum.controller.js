import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Forum from "../models/forum.models.js";

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

    const post = await Forum.createPost({
        title,
        content,
        category,
        tags: tags || [],
        author: {
            id: req.user.id,
            name: req.user.fullName,
            avatar: req.user.avatar
        }
    });

    return res.status(201).json(
        new ApiResponse(201, "Post created successfully", post)
    );
});

const getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const container = await getContainer();
    
    const querySpec = {
        query: `
            SELECT * FROM c 
            WHERE c.type IN ('forum_post', 'forum_comment') 
            AND (c.id = @id OR c.postId = @id)
        `,
        parameters: [{ name: '@id', value: id }]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    const post = resources.find(r => r.type === 'forum_post');
    const comments = resources.filter(r => r.type === 'forum_comment');

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return res.status(200).json(
        new ApiResponse(200, "Post retrieved successfully", { ...post, comments })
    );
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

    const comment = await Forum.createComment({
        postId,
        parentId,
        content,
        author: {
            id: req.user.id,
            name: req.user.fullName,
            avatar: req.user.avatar
        }
    });

    // Update post reply count
    const container = await getContainer();
    const { resource: post } = await container.item(postId).read();
    post.replies += 1;
    post.updatedAt = new Date().toISOString();
    await container.item(postId).replace(post);

    return res.status(201).json(
        new ApiResponse(201, "Comment created successfully", comment)
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
    getCategories
}; 