import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobDetails } from '@/components/features/jobs/JobDetails';
import { useAuth } from '../store/auth/AuthContext';
import styles from '../styles/Dashboard.module.css';

interface Job {
  id: string;
  title: string;
  description: string;
  skills: { name: string; yearsRequired: number; }[];
  postedDate: string;
  location: string;
  price: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  poster: {
    id: string;
    name: string;
    rating: number;
    jobsPosted: number;
    memberSince: string;
  };
}

export const JobMarketplace = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadJobs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/public`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleApplyJob = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          walletId: user?.walletId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply for job');
      }

      // Refresh jobs list after applying
      await loadJobs();
    } catch (err) {
      throw new Error('Failed to apply for job');
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/v1/jobs/${jobId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      // Refresh jobs list after saving
      await loadJobs();
    } catch (err) {
      throw new Error('Failed to save job');
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header section referencing JobMarketplace.tsx lines 12-15 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Job Marketplace</h1>
          <p className="text-gray-400">Browse and apply for available jobs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Listings */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <span className="text-gray-400">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No jobs available at the moment.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700"
                  onClick={() => setSelectedJob(job)}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                  <div className="flex items-center space-x-4 text-gray-400 mb-4">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.price} XRV</span>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills && job.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill.name}
                        className="bg-gray-700 text-white text-sm rounded-full px-3 py-1"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedJob && (
              <JobDetails
                {...selectedJob}
                onApply={handleApplyJob}
                onSave={handleSaveJob}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 