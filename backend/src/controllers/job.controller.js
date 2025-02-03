import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Job from "../models/job.models.js";
import User from "../models/user.models.js";
import Wallet from "../models/wallet.models.js";

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
    
    // First find the job
    const job = await Job.findJobById(id);
    
    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    // Check if the user owns the job
    if (job.userId !== req.user?.id) {
        throw new ApiError(403, "Unauthorized to delete this job");
    }

    // Proceed with deletion
    await Job.deleteJob(id);
    
    return res.status(200).json(
        new ApiResponse(200, "Job cancelled successfully", null)
    );
});

const applyForJob = asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applicant, application } = req.body;

    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    // Validate applicant exists
    const user = await User.findById(applicant.userId);
    if (!user) {
      throw new ApiError(404, "Applicant not found");
    }

    // Validate wallet exists
    const wallet = await Wallet.findById(applicant.walletId);
    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    // Create application
    const newApplication = {
      applicant: {
        userId: applicant.userId,
        walletId: applicant.walletId,
        name: applicant.name
      },
      coverLetter: application.coverLetter,
      proposedRate: application.proposedRate,
      estimatedDuration: application.estimatedDuration,
      portfolioLinks: application.portfolioLinks,
      submittedAt: application.submittedAt,
      status: 'pending'
    };

    // Add application to job
    job.applications = job.applications || [];
    job.applications.push(newApplication);
    await job.save();

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: newApplication
    });
  } catch (error) {
    console.error("Job application error:", error);
    throw new ApiError(500, "Error applying to job");
  }
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

const getUserActiveJobs = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // Optional: Add authorization check
    if (req.user.id !== userId && !req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized to view these jobs");
    }

    const jobs = await Job.findActiveJobsByUserId(userId);
    return res.status(200).json(
        new ApiResponse(200, "Active jobs retrieved successfully", { jobs })
    );
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
    getJobReviews,
    getUserActiveJobs
}; 