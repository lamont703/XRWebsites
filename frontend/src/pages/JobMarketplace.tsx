import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobDetails } from '@/components/features/jobs/JobDetails';
import { useAuth } from '../store/auth/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import JobApplication from '@/components/features/jobs/JobApplication';
import styles from '../styles/Dashboard.module.css'

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
  status: string;
}

export const JobMarketplace = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

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
      // Filter out cancelled jobs
      const activeJobs = data.jobs.filter(job => job.status !== 'cancelled');
      setJobs(activeJobs);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleApplyJob = async (jobId: string, applicationData: JobApplication) => {
    try {
      if (!user?.id || !user?.walletId) {
        throw new Error('Please complete your profile and add a wallet address before applying for jobs');
      }

      console.log('Submitting application with data:', {
        userId: user.id,
        walletId: user.walletId,
        jobId,
        applicationData
      });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          applicant: {
            userId: user.id,
            walletId: user.walletId,
            name: user.name || 'Anonymous',
          },
          application: {
            coverLetter: applicationData.coverLetter,
            proposedRate: applicationData.proposedRate,
            estimatedDuration: applicationData.estimatedDuration,
            portfolioLinks: applicationData.portfolioLinks,
            submittedAt: new Date().toISOString(),
            status: 'pending'
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Application submission failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || 'Failed to apply for job');
      }

      console.log('Application submitted successfully:', data);
      await loadJobs();
      return data;
    } catch (err) {
      console.error('Application error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to apply for job');
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}/save`, {
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

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    // Only open modal on mobile/tablet views
    if (window.innerWidth < 1024) {
      setIsMobileDetailsOpen(true);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
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
                  onClick={() => handleJobClick(job)}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                  <div className="flex items-center space-x-4 text-gray-400 mb-4">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.price} XRV</span>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills?.slice(0, 3).map((skill) => (
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

          {/* Desktop Job Details Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            {selectedJob && (
              <JobDetails
                {...selectedJob}
                onApply={handleApplyJob}
                onSave={handleSaveJob}
              />
            )}
          </div>
        </div>

        {/* Mobile Job Details Modal */}
        <Transition appear show={isMobileDetailsOpen} as={Fragment}>
          <Dialog 
            as="div"
            className="relative z-50 lg:hidden"
            onClose={() => setIsMobileDetailsOpen(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    {selectedJob && (
                      <JobDetails
                        {...selectedJob}
                        onApply={handleApplyJob}
                        onSave={handleSaveJob}
                      />
                    )}
                    <button
                      className="mt-4 w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                      onClick={() => setIsMobileDetailsOpen(false)}
                    >
                      Close
                    </button>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </MainLayout>
  );
}; 