import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import Job from '../models/job.models.js';
import { getUserActiveJobs, deleteJob, updateApplicationStatus } from '../controllers/job.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { getContainer } from '../database.js';


const router = express.Router();

// Public routes
router.get('/public', async (req, res) => {
  try {
    const jobs = await Job.findAll({ status: 'active' });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Protected routes
router.use(authMiddleware);

// Get all jobs (with auth)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Create new job
router.post('/', async (req, res) => {
  try {
    const job = await Job.createJobPosting(req.body);
    res.status(201).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job' });
  }
});

// Apply to job
router.post('/:jobId/apply', verifyJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applicant, application } = req.body;

    // Find job with partition key and proper ID format
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @jobId AND c.type = 'job_posting'",
      parameters: [{ name: "@jobId", value: jobId }]
    };
    
    const container = await getContainer();
    // Use partition key in query options
    const { resources: jobs } = await container.items
      .query(querySpec, {
        partitionKey: 'job_posting'
      })
      .fetchAll();

    console.log('Job search results:', {
      jobId,
      found: jobs.length > 0,
      jobs
    });

    const job = jobs[0];
    if (!job) {
      console.log('Job not found:', jobId);
      return res.status(404).json({ 
        message: 'Job not found',
        details: `No job found with ID: ${jobId}`
      });
    }

    // Create application document
    const applicationDoc = {
      id: `application-${Date.now()}`,
      type: 'job_application',
      jobId,
      applicant: {
        userId: applicant.userId,
        walletId: applicant.walletId,
        name: applicant.name
      },
      coverLetter: application.coverLetter,
      proposedRate: application.proposedRate,
      estimatedDuration: application.estimatedDuration,
      portfolioLinks: application.portfolioLinks,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create application in CosmosDB
    const { resource: createdApplication } = await container.items.create(applicationDoc);

    return res.status(201).json({
      message: 'Application submitted successfully',
      data: createdApplication
    });

  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ message: 'Error applying to job' });
  }
});

router.get("/user/:userId/active", verifyJWT, getUserActiveJobs);

router.delete('/:id', verifyJWT, deleteJob);

// Get all applications for a user
router.get('/applications/user', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const applications = await Job.findApplicationsByUserId(userId);
        
        res.json({
            success: true,
            data: applications
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Get all applications for a user
router.get('/applications/user/:userId', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const container = await getContainer();
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'job_application' AND c.applicant.userId = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    
    const { resources: applications } = await container.items.query(querySpec).fetchAll();
    
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Cancel an application
router.put('/applications/:applicationId/cancel', verifyJWT, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const container = await getContainer();
    
    // Find the application with partition key
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @applicationId AND c.type = 'job_application'",
      parameters: [{ name: "@applicationId", value: applicationId }]
    };
    
    const { resources: applications } = await container.items
      .query(querySpec, {
        partitionKey: 'job_application'  // Add partition key to query
      })
      .fetchAll();

    const application = applications[0];

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the user owns this application
    if (application.applicant.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to cancel this application' });
    }

    // Update application status to cancelled using item operation with partition key
    const { resource: updatedApplication } = await container.item(applicationId, 'job_application')
      .replace({
        ...application,
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Application cancelled successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error cancelling application:', error);
    res.status(500).json({ message: 'Error cancelling application' });
  }
});

// Get applications for a specific job
router.get('/:jobId/applications', verifyJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // First verify the job exists and user has permission to view applications
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job poster
    if (job.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    // Get applications using our model method
    const applications = await Job.findApplicationsByJobId(jobId);

    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: applications
    });

  } catch (error) {
    console.error('Error fetching job applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

// Update application status (Accept/Decline)
router.put('/applications/:applicationId/status', verifyJWT, updateApplicationStatus);

export default router;