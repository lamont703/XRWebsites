import { getContainer } from '../database.js';
import ApiError from '../utils/ApiError.js';

class ForumPost {
    constructor() {
        this.type = 'forum_post';
    }

    static async find(query) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: `SELECT * FROM c WHERE c.type = '${this.type}' AND c.userId = @userId`,
                parameters: [{ name: '@userId', value: query.userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in ForumPost.find:", error);
            throw new ApiError(500, "Failed to fetch forum posts");
        }
    }

    static async countDocuments(query) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: `SELECT VALUE COUNT(1) FROM c WHERE c.type = '${this.type}' AND c.userId = @userId`,
                parameters: [{ name: '@userId', value: query.userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || 0;
        } catch (error) {
            console.error("Error in ForumPost.countDocuments:", error);
            throw new ApiError(500, "Failed to count forum posts");
        }
    }
}

export default ForumPost; 