import { getContainer } from '../database.js';
import ApiError from '../utils/ApiError.js';

class JobApplication {
    constructor() {
        this.type = 'job_application';
    }

    static async find(query) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: `SELECT * FROM c WHERE c.type = '${this.type}' AND c.applicantId = @applicantId`,
                parameters: [{ name: '@applicantId', value: query.applicantId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in JobApplication.find:", error);
            throw new ApiError(500, "Failed to fetch job applications");
        }
    }

    static async countDocuments(query) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: `SELECT VALUE COUNT(1) FROM c WHERE c.type = '${this.type}' AND c.applicantId = @applicantId`,
                parameters: [{ name: '@applicantId', value: query.applicantId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources[0] || 0;
        } catch (error) {
            console.error("Error in JobApplication.countDocuments:", error);
            throw new ApiError(500, "Failed to count job applications");
        }
    }
}

export default JobApplication; 