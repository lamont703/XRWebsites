import React, { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth/Auth';
import styles from '@/styles/ActiveJobs.module.css';

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
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3 className={styles.title}>Active Jobs Posted</h3>
          <p className={styles.value}>{activeJobs.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.title}>My Applications</h3>
          <p className={styles.value}>{applications.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.title}>Average Rating</h3>
          <p className={styles.value}>0.0</p>
        </div>
      </div>

      <div className={styles.jobsContainer}>
        <h2 className={styles.title}>My Posted Jobs</h2>
        {activeJobs.length === 0 ? (
          <div className={styles.emptyState}>No active jobs found.</div>
        ) : (
          <div className={styles.jobsList}>
            {activeJobs.map((job) => (
              <div 
                key={job.id} 
                className={styles.jobCard}
                onClick={() => handleJobClick(job.id)}
              >
                <div className={styles.jobHeader}>
                  <div>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <p className={styles.jobDate}>
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelJob(job.id);
                    }}
                    className={styles.cancelButton}
                  >
                    Cancel Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.jobsContainer}>
        <h2 className={styles.title}>My Submitted Applications</h2>
        {applications.length === 0 ? (
          <div className={styles.emptyState}>No applications submitted.</div>
        ) : (
          <div className={styles.jobsList}>
            {applications.map((application) => (
              <div key={application.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <div>
                    <h3 className={styles.jobTitle}>
                      Application for Job #{application.jobId}
                    </h3>
                    <p className={styles.jobDate}>
                      Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                    </p>
                    <p className={styles.jobDate}>
                      Status: <span className="capitalize">{application.status}</span>
                    </p>
                    <p className={styles.jobDate}>
                      Proposed Rate: ${application.proposedRate}
                    </p>
                  </div>
                  {application.status === 'pending' && (
                    <button
                      onClick={() => onApplicationCancel?.(application.id)}
                      className={styles.cancelButton}
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
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>Submitted Applications</div>
            <button
              onClick={() => setShowApplicationsModal(false)}
              className={styles.closeButton}
            >
              ✕
            </button>
            
            {jobApplications.length === 0 ? (
              <p className={styles.emptyState}>No applications yet</p>
            ) : (
              <div className={styles.jobsList}>
                {jobApplications.map((app) => (
                  <div key={app.id} className={styles.jobCard}>
                    <div className={styles.jobHeader}>
                      <div>
                        <h3 className={styles.jobTitle}>
                          {app.applicant.name || 'Anonymous'}
                        </h3>
                        <p className={styles.jobDate}>
                          Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={styles.statusBadge}>
                        {app.status}
                      </span>
                    </div>
                    <div className={styles.jobDetails}>
                      <p><span className={styles.label}>Proposed Rate:</span> ${app.proposedRate}</p>
                      <p><span className={styles.label}>Estimated Duration:</span> {app.estimatedDuration} days</p>
                      {app.coverLetter && (
                        <p className={styles.jobDetails}>{app.coverLetter}</p>
                      )}
                    </div>

                    {app.status === 'pending' && (
                      <div className={styles.buttonGroup}>
                        <button
                          onClick={() => handleApplicationResponse(app.id, 'accepted')}
                          className={styles.acceptButton}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleApplicationResponse(app.id, 'rejected')}
                          className={styles.declineButton}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
}; 