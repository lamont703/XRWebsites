import { getContainer } from '../database.js';
import ApiError from '../utils/ApiError.js';

const Forum = {
    // Post Methods
    async createPost(postData) {
        try {
            const container = await getContainer();
            const post = {
                id: `post_${Date.now()}`,
                type: 'forum_post',
                title: postData.title,
                content: postData.content,
                author: postData.author,
                category: postData.category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                likes: 0,
                likedBy: [],
                replies: 0
            };

            const { resource } = await container.items.create(post);
            return resource;
        } catch (error) {
            console.error("Error in createPost:", error);
            throw new ApiError(500, "Failed to create post");
        }
    },

    async findPosts(filters = {}, sort = 'latest', page = 1, limit = 10) {
        try {
            const container = await getContainer();
            let querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'forum_post' AND (NOT IS_DEFINED(c.status) OR c.status != 'deleted')",
                parameters: []
            };

            // Add filters
            if (filters.category) {
                querySpec.query += " AND c.category = @category";
                querySpec.parameters.push({ name: "@category", value: filters.category });
            }

            if (filters.search) {
                querySpec.query += " AND (CONTAINS(c.title, @search) OR CONTAINS(c.content, @search))";
                querySpec.parameters.push({ name: "@search", value: filters.search });
            }

            // Add sorting
            querySpec.query += sort === 'latest' 
                ? " ORDER BY c.createdAt DESC"
                : sort === 'popular'
                ? " ORDER BY c.likes DESC"
                : " ORDER BY c.replies ASC";

            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findPosts:", error);
            throw new ApiError(500, "Failed to fetch forum posts");
        }
    },

    // Comment Methods
    async createComment(commentData) {
        try {
            const container = await getContainer();
            const comment = {
                id: `comment_${Date.now()}`,
                type: 'forum_comment',
                postId: commentData.postId,
                parentId: commentData.parentId || null,
                content: commentData.content,
                author: commentData.author,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                likes: 0,
                likedBy: []
            };

            const { resource } = await container.items.create(comment);
            return resource;
        } catch (error) {
            console.error("Error in createComment:", error);
            throw new ApiError(500, "Failed to create comment");
        }
    },

    async toggleLike(itemId, userId) {
        try {
            console.log('Starting toggleLike for:', { itemId, userId });
            const container = await getContainer();
            
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @id",
                parameters: [{ name: '@id', value: itemId }]
            };
            
            console.log('Executing query:', querySpec);
            const { resources } = await container.items.query(querySpec).fetchAll();
            console.log('Query results:', resources);
            
            const item = resources[0];
            if (!item) {
                console.error('Item not found:', itemId);
                throw new ApiError(404, "Item not found");
            }

            console.log('Current item state:', {
                likes: item.likes,
                likedBy: item.likedBy,
                type: item.type
            });

            if (!item.likedBy) item.likedBy = [];
            if (!item.likes) item.likes = 0;

            const userLikeIndex = item.likedBy.indexOf(userId);
            const isLiking = userLikeIndex === -1;
            
            if (isLiking) {
                item.likedBy.push(userId);
                item.likes += 1;
            } else {
                item.likedBy.splice(userLikeIndex, 1);
                item.likes -= 1;
            }

            console.log('Updated item state:', {
                likes: item.likes,
                likedBy: item.likedBy
            });

            item.updatedAt = new Date().toISOString();
            const { resource: updatedItem } = await container.items.upsert(item);
            console.log('Upsert result:', updatedItem);
            
            return {
                likes: updatedItem.likes,
                liked: isLiking
            };
        } catch (error) {
            console.error("Error in toggleLike:", error);
            throw new ApiError(500, "Failed to update like status");
        }
    },

    // Category Methods
    async getCategories() {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'forum_category'"
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in getCategories:", error);
            throw new ApiError(500, "Failed to fetch categories");
        }
    },

    // Stats Methods
    async updateCategoryStats(categoryId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: `
                    SELECT VALUE {
                        'totalPosts': COUNT(1),
                        'activeUsers': COUNT(DISTINCT c.author.id),
                        'lastPostDate': MAX(c.createdAt)
                    }
                    FROM c 
                    WHERE c.type = 'forum_post' 
                    AND c.category = @categoryId
                `,
                parameters: [{ name: "@categoryId", value: categoryId }]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0];
        } catch (error) {
            console.error("Error in updateCategoryStats:", error);
            throw new ApiError(500, "Failed to update category stats");
        }
    },

    async softDeletePost(postId, userId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'forum_post' AND c.id = @id",
                parameters: [{ name: '@id', value: postId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const post = resources[0];

            if (!post) {
                throw new ApiError(404, "Post not found");
            }

            if (post.author.id !== userId) {
                throw new ApiError(403, "Unauthorized to delete this post");
            }

            const updatedPost = {
                ...post,
                status: 'deleted',
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const { resource } = await container.items.upsert(updatedPost);
            return resource;
        } catch (error) {
            console.error("Error in softDeletePost:", error);
            throw new ApiError(500, "Failed to delete post");
        }
    },

    async softDeleteComment(commentId, userId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'forum_comment' AND c.id = @id",
                parameters: [{ name: '@id', value: commentId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            const comment = resources[0];

            if (!comment) {
                throw new ApiError(404, "Comment not found");
            }

            if (comment.author.id !== userId) {
                throw new ApiError(403, "Unauthorized to delete this comment");
            }

            const updatedComment = {
                ...comment,
                status: 'deleted',
                deletedAt: new Date().toISOString()
            };

            const { resource } = await container.items.upsert(updatedComment);
            return resource;
        } catch (error) {
            console.error("Error in softDeleteComment:", error);
            throw new ApiError(500, "Failed to delete comment");
        }
    }
};

export default Forum; 