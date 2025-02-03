import React, { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth/AuthContext';

interface ActiveJobsProps {
  onJobCancel?: (jobId: string) => Promise<void>;
  onApplicationCancel?: (applicationId: string) => Promise<void>;
}

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  applications: any[];
}

interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  created_at: string;
}

export const ActiveJobs: React.FC<ActiveJobsProps> = ({ onJobCancel, onApplicationCancel }) => {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/user/${user?.id}/active`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }),
          fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/applications/user/${user?.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          })
        ]);

        const jobsData = await jobsResponse.json();
        const applicationsData = await applicationsResponse.json();

        setActiveJobs(jobsData.data?.jobs || []);
        setApplications(applicationsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load jobs data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleCancelJob = async (jobId: string) => {
    try {
      if (onJobCancel) {
        await onJobCancel(jobId);
        await loadActiveJobs(); // Refresh the list after cancellation
      }
    } catch (err) {
      setError('Failed to cancel job');
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-400 text-center py-8">
        Loading active jobs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Active Jobs Posted</h3>
          <p className="text-3xl font-bold text-white">{activeJobs.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-2">My Applications</h3>
          <p className="text-3xl font-bold text-white">{applications.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Average Rating</h3>
          <p className="text-3xl font-bold text-white">0.0</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-4">My Posted Jobs</h2>
        {activeJobs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No active jobs found.
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-gray-400">
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelJob(job.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Cancel Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-4">My Submitted Applications</h2>
        {applications.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No applications submitted.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Application for Job #{application.jobId}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Status: <span className="capitalize">{application.status}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Proposed Rate: ${application.proposedRate}
                    </p>
                  </div>
                  {application.status === 'pending' && (
                    <button
                      onClick={() => onApplicationCancel?.(application.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Cancel Application
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}; 