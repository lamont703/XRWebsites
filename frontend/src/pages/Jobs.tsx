import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '../store/auth/AuthContext';
import { JobPosting, JobPostData } from '@/components/features/jobs/JobPosting';
import styles from '../styles/Dashboard.module.css';

export const Jobs = () => {
  const { user } = useAuth();
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePostJob = async (jobData: JobPostData) => {
    try {
      // Combine job data with user information
      const fullJobData = {
        ...jobData,
        userId: user?.id,
        walletId: user?.walletId,
        poster: {
          id: user?.id,
          name: user?.name || 'Anonymous',
          rating: user?.rating || 0,
          jobsPosted: user?.jobsPosted || 0,
          memberSince: user?.createdAt || new Date().toISOString()
        }
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fullJobData)
      });

      if (!response.ok) {
        throw new Error('Failed to post job');
      }

      setShowPostingForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job');
      throw err;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Jobs Dashboard</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your active and completed jobs</p>
          </div>
          <button
            onClick={() => setShowPostingForm(!showPostingForm)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg
              transition-colors duration-200 text-sm sm:text-base font-medium"
          >
            {showPostingForm ? 'Cancel' : 'Post New Job'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {showPostingForm ? (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 max-w-full overflow-x-hidden">
            <JobPosting onSubmit={handlePostJob} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Active Jobs</h3>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Applications</h3>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Average Rating</h3>
                <p className="text-3xl font-bold text-white">0.0</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-4">Active Jobs</h2>
              <div className="text-gray-400 text-center py-8">
                No active jobs found.
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}; 