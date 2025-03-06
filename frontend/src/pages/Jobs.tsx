import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { JobPosting, JobPostData } from '@/components/features/jobs/JobPosting';
import { ActiveJobs } from '@/components/features/jobs/ActiveJobs';
import styles from '@/styles/Jobs.module.css';

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
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Jobs Dashboard</h1>
            <p className={styles.subtitle}>Manage your active and completed jobs</p>
          </div>
          <button
            onClick={() => setShowPostingForm(!showPostingForm)}
            className={styles.postButton}
          >
            {showPostingForm ? 'Cancel' : 'Post New Job'}
          </button>
        </div>

        {success && (
          <div className={styles.successAlert}>
            <p className={styles.successText}>{success}</p>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {showPostingForm ? (
          <div className={styles.formContainer}>
            <JobPosting onSubmit={handlePostJob} />
          </div>
        ) : (
          <ActiveJobs 
            onJobCancel={handleCancelJob} 
            onApplicationCancel={handleCancelApplication}
            key={refreshJobs} 
          />
        )}
      </div>
    </MainLayout>
  );
}; 