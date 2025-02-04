import { getContainer } from '../database.js';
import ApiError from '../utils/ApiError.js';

class Review {
    constructor() {
        this.type = 'review';
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
            console.error("Error in Review.find:", error);
            throw new ApiError(500, "Failed to fetch reviews");
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
            console.error("Error in Review.countDocuments:", error);
            throw new ApiError(500, "Failed to count reviews");
        }
    }
}

export default Review; 