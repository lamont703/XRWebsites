import React, { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth/Auth';

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

export const ActiveJobs: React.FC<ActiveJobsProps> = ({ onJobCancel, onApplicationCancel }) => {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  const loadActiveJobs = async () => {
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

  useEffect(() => {
    if (user?.id) {
      loadActiveJobs();
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

  const loadJobApplications = async (jobId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/applications`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load applications');
      }
      
      const data = await response.json();
      console.log('Loaded applications:', data); // Debug log
      setJobApplications(data.data || []);
    } catch (error) {
      console.error('Error loading job applications:', error);
      setError('Failed to load applications');
    }
  };

  const handleJobClick = async (jobId: string) => {
    setSelectedJob(jobId);
    await loadJobApplications(jobId);
    setShowApplicationsModal(true);
  };

  const handleApplicationResponse = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/jobs/applications/${applicationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) throw new Error('Failed to update application status');

      // Refresh applications list
      if (selectedJob) {
        await loadJobApplications(selectedJob);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      setError('Failed to update application status');
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
              <div 
                key={job.id} 
                className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => handleJobClick(job.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-gray-400">
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelJob(job.id);
                    }}
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

      {/* Applications Modal */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Submitted Applications</h2>
              <button
                onClick={() => setShowApplicationsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {jobApplications.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {jobApplications.map((app) => (
                  <div key={app.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {app.applicant.name || 'Anonymous'}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${
                          app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          app.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p><span className="text-gray-400">Proposed Rate:</span> ${app.proposedRate}</p>
                        <p><span className="text-gray-400">Estimated Duration:</span> {app.estimatedDuration} days</p>
                        {app.coverLetter && (
                          <p className="mt-2">{app.coverLetter}</p>
                        )}
                      </div>

                      {app.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleApplicationResponse(app.id, 'accepted')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleApplicationResponse(app.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}; 