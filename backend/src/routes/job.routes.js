import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import Job from '../models/job.models.js';

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
router.post('/:jobId/apply', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, walletId } = req.body;

    const job = await Job.findJobById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Add application logic here using your Job model methods
    job.applications = job.applications || [];
    job.applications.push({
      userId,
      walletId,
      status: 'pending',
      appliedAt: new Date()
    });

    // Update the job with new application
    await Job.updateJob(jobId, job);
    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error applying to job' });
  }
});

export default router;