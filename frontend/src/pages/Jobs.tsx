import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { JobPosting, JobPostData } from '@/components/features/jobs/JobPosting';
import {} from '../styles/Dashboard.module.css';
import { ActiveJobs } from '@/components/features/jobs/ActiveJobs';

export const Jobs = () => {
  const { user } = useAuth();
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshJobs, setRefreshJobs] = useState(0);

  const handlePostJob = async (jobData: JobPostData) => {
    try {
      // Combine job data with user information and CosmosDB requirements
      const fullJobData = {
        id: `job-${Date.now()}`,
        type: 'job', // Add type for partition key
        ...jobData,
        userId: user?.id,
        walletId: user?.walletId,
        poster: {
          id: user?.id,
          name: user?.name || 'Anonymous',
          rating: user?.rating || 0,
          jobsPosted: user?.jobsPosted || 0,
          memberSince: user?.createdAt || new Date().toISOString()
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      setSuccess('Job posted successfully!');
      setRefreshJobs(prev => prev + 1);
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 10000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job');
      throw err;
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel job');
      }

      setSuccess('Job cancelled successfully');
      setRefreshJobs(prev => prev + 1);

      setTimeout(() => {
        setSuccess(null);
      }, 10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  };

  const handleCancelApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/jobs/applications/${applicationId}/cancel`, 
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel application');
      }

      setSuccess('Application cancelled successfully');
      setRefreshJobs(prev => prev + 1);

      setTimeout(() => {
        setSuccess(null);
      }, 10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel application');
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

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-500 text-sm">{success}</p>
          </div>
        )}

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
            {!showPostingForm && (
              <ActiveJobs 
                onJobCancel={handleCancelJob} 
                onApplicationCancel={handleCancelApplication}
                key={refreshJobs} 
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}; 