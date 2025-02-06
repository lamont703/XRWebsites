import { getContainer } from '../database.js';
import ApiError from '../utils/ApiError.js';

const Forum = {
    // Post Methods
    async createPost(postData) {
        try {
            console.log('Creating post with data:', postData);
            const container = await getContainer();
            const post = {
                id: `post_${Date.now()}`,
                type: 'forum_post',
                title: postData.title,
                content: postData.content,
                category: postData.category,
                tags: postData.tags || [],
                author: {
                    id: postData.author.id,
                    name: postData.author.name,
                    username: postData.author.username,
                    avatar: postData.author.avatar
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                likes: 0,
                replies: 0,
                likedBy: [],
                isStickied: false
            };
            console.log('Formatted post data:', post);

            const { resource } = await container.items.create(post);
            console.log('Created resource:', resource);
            return resource;
        } catch (error) {
            console.error("Error in createPost:", error);
            throw new ApiError(500, "Failed to create forum post");
        }
    },

    async findPosts(filters = {}, sort = 'latest', page = 1, limit = 10) {
        try {
            const container = await getContainer();
            let querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'forum_post'",
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
    }
};

export default Forum; 