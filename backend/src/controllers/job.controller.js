import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Job from "../models/job.models.js";

const getAllJobs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, budget_min, budget_max, skills } = req.query;
    const result = await Job.findAll({ category, budget_min, budget_max, skills }, { page, limit });
    return res.status(200).json(new ApiResponse(200, "Jobs retrieved successfully", result));
});

const createJob = asyncHandler(async (req, res) => {
    const { title, description, category, budget, required_skills, deadline, deliverables } = req.body;

    if (!title || !description || !budget) {
        throw new ApiError(400, "Title, description, and budget are required");
    }

    const job = await Job.createJobPosting({
        title,
        description,
        category,
        budget: Number(budget),
        required_skills: required_skills || [],
        deadline,
        deliverables,
        business_id: req.user.id
    });

    return res.status(201).json(new ApiResponse(201, "Job created successfully", job));
});

const getJobById = asyncHandler(async (req, res) => {
    console.log("getJobById called with ID:", req.params.id);
    
    try {
        const job = await Job.findJobById(req.params.id);
        console.log("Job found:", job);
        
        if (!job) {
            console.log("No job found with ID:", req.params.id);
            throw new ApiError(404, "Job not found");
        }
        
        console.log("Returning job:", job);
        return res.status(200).json(new ApiResponse(200, "Job retrieved successfully", job));
    } catch (error) {
        console.error("Error in getJobById:", error);
        throw error;
    }
});

const updateJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const job = await Job.findJobById(id);
    
    if (!job) throw new ApiError(404, "Job not found");
    if (job.business_id !== req.user.id && !req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized to update this job");
    }

    const updatedJob = await Job.update(id, req.body);
    return res.status(200).json(new ApiResponse(200, "Job updated successfully", updatedJob));
});

const deleteJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const job = await Job.findJobById(id);
    
    if (!job) throw new ApiError(404, "Job not found");
    if (job.business_id !== req.user.id && !req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized to delete this job");
    }

    await Job.delete(id);
    return res.status(200).json(new ApiResponse(200, "Job deleted successfully", {}));
});

const applyForJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cover_letter, bid_amount } = req.body;
    
    const job = await Job.findJobById(id);
    if (!job) throw new ApiError(404, "Job not found");

    const application = await Job.createApplication({
        job_id: id,
        developer_id: req.user.id,
        cover_letter,
        bid_amount: Number(bid_amount)
    });

    return res.status(201).json(new ApiResponse(201, "Application submitted successfully", application));
});

const getJobApplications = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const job = await Job.findJobById(id);
    
    if (!job) throw new ApiError(404, "Job not found");
    if (job.business_id !== req.user.id && !req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized to view applications");
    }

    const applications = await Job.findApplicationsByJobId(id);
    return res.status(200).json(new ApiResponse(200, "Applications retrieved successfully", applications));
});

const createJobReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const job = await Job.findJobById(id);
    if (!job) throw new ApiError(404, "Job not found");

    const review = await Job.createReview({
        job_id: id,
        reviewer_id: req.user.id,
        reviewer_type: job.business_id === req.user.id ? "business" : "developer",
        rating,
        comment
    });

    return res.status(201).json(new ApiResponse(201, "Review submitted successfully", review));
});

const getJobReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reviews = await Job.findReviewsByJobId(id);
    return res.status(200).json(new ApiResponse(200, "Reviews retrieved successfully", reviews));
});

export {
    getAllJobs,
    createJob,
    getJobById,
    updateJob,
    deleteJob,
    applyForJob,
    getJobApplications,
    createJobReview,
    getJobReviews
}; 