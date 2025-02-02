import { getContainer } from "../db/index.js";
import ApiError from "../utils/ApiError.js";

const Job = {
    // Job Posting Methods
    async createJobPosting(jobData) {
        try {
            const container = await getContainer();
            if (!jobData.id) {
                jobData.id = `job-${Date.now()}`;
            }
            
            // Add required fields
            jobData.type = 'job_posting';
            jobData.created_at = new Date();
            jobData.updated_at = new Date();
            jobData.status = jobData.status || "active";
            jobData.applications = [];
            jobData.reviews = [];

            const { resource } = await container.items.create(jobData);
            return resource;
        } catch (error) {
            console.error("Error in createJobPosting:", error);
            throw error;
        }
    },

    async findJobById(id) {
        try {
            const container = await getContainer();
            const jobId = id.startsWith('job-') ? id : `job-${id}`;
            // Trim any whitespace or newlines from the ID
            const cleanJobId = jobId.trim();
            console.log("Normalized job ID:", cleanJobId);
            
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_posting' AND c.id = @id",
                parameters: [{ name: "@id", value: cleanJobId }]
            };
            console.log("Query spec:", JSON.stringify(querySpec, null, 2));
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            console.log("Query results:", JSON.stringify(resources, null, 2));
            
            if (!resources || resources.length === 0) {
                console.log("No job found with ID:", cleanJobId);
                return null;
            }
            
            console.log("Found job:", JSON.stringify(resources[0], null, 2));
            return resources[0];
        } catch (error) {
            console.error("Error in findJobById:", error);
            throw error;
        }
    },

    // Job Application Methods
    async createApplication(applicationData) {
        try {
            const container = await getContainer();
            if (!applicationData.id) {
                applicationData.id = `application-${Date.now()}`;
            }
            
            applicationData.type = 'job_application';
            applicationData.created_at = new Date();
            applicationData.updated_at = new Date();
            applicationData.status = applicationData.status || "pending";

            const { resource } = await container.items.create(applicationData);
            return resource;
        } catch (error) {
            console.error("Error in createApplication:", error);
            throw error;
        }
    },

    async findApplicationsByJobId(jobId, options = {}) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_application' AND c.job_id = @jobId",
                parameters: [{ name: "@jobId", value: jobId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findApplicationsByJobId:", error);
            throw error;
        }
    },

    // Job Review Methods
    async createReview(reviewData) {
        try {
            const container = await getContainer();
            if (!reviewData.id) {
                reviewData.id = `review-${Date.now()}`;
            }
            
            reviewData.type = 'job_review';
            reviewData.created_at = new Date();
            reviewData.updated_at = new Date();

            const { resource } = await container.items.create(reviewData);
            return resource;
        } catch (error) {
            console.error("Error in createReview:", error);
            throw error;
        }
    },

    async findReviewsByJobId(jobId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_review' AND c.job_id = @jobId",
                parameters: [{ name: "@jobId", value: jobId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findReviewsByJobId:", error);
            throw error;
        }
    },

    // General Job Methods
    async findAll(filters = {}, options = {}) {
        try {
            const container = await getContainer();
            let querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_posting'",
                parameters: []
            };
            
            // Add filters
            if (filters.category) {
                querySpec.query += " AND c.category = @category";
                querySpec.parameters.push({ name: "@category", value: filters.category });
            }
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findAll:", error);
            throw error;
        }
    },

    async update(id, updateData) {
        try {
            const container = await getContainer();
            const job = await this.findJobById(id);
            
            if (!job) {
                throw new ApiError(404, "Job not found");
            }

            const updatedJob = {
                ...job,
                ...updateData,
                updated_at: new Date()
            };

            const { resource } = await container.items.upsert(updatedJob);
            return resource;
        } catch (error) {
            console.error("Error in update:", error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const container = await getContainer();
            const job = await this.findJobById(id);
            
            if (!job) {
                throw new ApiError(404, "Job not found");
            }

            // Soft delete approach - update status and add deletion timestamp
            const updatedJob = {
                ...job,
                type: 'job_posting',
                status: 'deleted',
                deleted_at: new Date(),
                updated_at: new Date()
            };

            // Using upsert with the correct partition key (type)
            const { resource } = await container.items.upsert(updatedJob);
            console.log("Job deleted (soft delete) successfully");
            return resource;

        } catch (error) {
            console.error("Error in delete:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Failed to delete job");
        }
    }
};

export default Job; 