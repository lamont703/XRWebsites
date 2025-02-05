import { getContainer } from "../database.js";
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

    async findById(id) {
        try {
            const container = await getContainer();
            const jobId = id.startsWith('job-') ? id : `job-${id}`;
            const cleanJobId = jobId.trim();
            
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_posting' AND c.id = @id",
                parameters: [{ name: "@id", value: cleanJobId }]
            };

            const { resources } = await container.items
                .query(querySpec, { partitionKey: 'job_posting' })
                .fetchAll();

            return resources[0];
        } catch (error) {
            console.error("Error in findById:", error);
            throw error;
        }
    },

    // Job Application Methods
    async createApplication(jobId, applicationData) {
        try {
            const container = await getContainer();
            const job = await this.findById(jobId);

            if (!job) {
                throw new Error('Job not found');
            }

            const application = {
                id: `application-${Date.now()}`,
                type: 'job_application',
                job_id: jobId,
                created_at: new Date(),
                updated_at: new Date(),
                status: 'pending',
                ...applicationData,
                applicant: {
                    id: applicationData.userId,
                    name: applicationData.name || 'Anonymous',
                },
                application: {
                    coverLetter: applicationData.coverLetter,
                    proposedRate: applicationData.proposedRate,
                    estimatedDuration: applicationData.estimatedDuration,
                    portfolioLinks: applicationData.portfolioLinks || [],
                    submittedAt: new Date(),
                }
            };

            // Create the application document
            const { resource: createdApplication } = await container.items.create(application);

            // Update the job's applications array
            job.applications = job.applications || [];
            job.applications.push(createdApplication.id);
            job.updated_at = new Date();

            // Update the job document
            await container.item(jobId).replace(job);

            return createdApplication;
        } catch (error) {
            console.error("Error in createApplication:", error);
            throw error;
        }
    },

    async findApplicationsByJobId(jobId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_application' AND c.jobId = @jobId",
                parameters: [{ name: "@jobId", value: jobId }]
            };
            
            const { resources } = await container.items
                .query(querySpec, { partitionKey: 'job_application' })
                .fetchAll();

            return resources;
        } catch (error) {
            console.error("Error in findApplicationsByJobId:", error);
            throw error;
        }
    },

    async findApplicationsByUserId(userId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_application' AND c.applicant.userId = @userId",
                parameters: [{ name: "@userId", value: userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findApplicationsByUserId:", error);
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
            const job = await this.findById(id);
            
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
            const job = await this.findById(id);
            
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
    },

    async findActiveJobsByUserId(userId) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.type = 'job_posting' AND c.userId = @userId AND c.status = 'active'",
                parameters: [{ name: "@userId", value: userId }]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            return resources;
        } catch (error) {
            console.error("Error in findActiveJobsByUserId:", error);
            throw error;
        }
    },

    async deleteJob(jobId) {
        try {
            const container = await getContainer();
            const job = await this.findById(jobId);
            
            if (!job) {
                throw new ApiError(404, "Job not found");
            }

            // Soft delete by updating status
            const updatedJob = {
                ...job,
                status: 'cancelled',
                updated_at: new Date()
            };
            
            // Use upsert with the correct partition key
            const { resource } = await container.items.upsert(updatedJob);
            return resource;
        } catch (error) {
            console.error("Error in deleteJob:", error);
            throw error;
        }
    },

    async updateApplicationStatus(applicationId, status) {
        try {
            const container = await getContainer();
            const querySpec = {
                query: "SELECT * FROM c WHERE c.id = @applicationId AND c.type = 'job_application'",
                parameters: [{ name: "@applicationId", value: applicationId }]
            };
            
            const { resources } = await container.items
                .query(querySpec, { partitionKey: 'job_application' })
                .fetchAll();

            const application = resources[0];
            if (!application) {
                throw new Error('Application not found');
            }

            application.status = status;
            application.updated_at = new Date().toISOString();

            const { resource: updatedApplication } = await container.item(applicationId, 'job_application')
                .replace(application);
            
            return updatedApplication;
        } catch (error) {
            console.error("Error in updateApplicationStatus:", error);
            throw error;
        }
    }
};

export default Job; 