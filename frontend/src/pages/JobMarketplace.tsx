import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobDetails } from '@/components/features/jobs/JobDetails';
import { useAuth } from '@/store/auth/Auth';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { JobApplication } from '@/components/features/jobs/JobApplication';
import styles from '../styles/Dashboard.module.css'
import { NFTListings } from '@/components/features/marketplace/NFTListings';
import { ActiveJobs } from '@/components/features/jobs/ActiveJobs';
import { JobCard } from '@/components/features/jobs/JobCard';
import { NFTListingCard } from '@/components/features/marketplace/NFTListingCard';

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

interface MarketplaceItem {
    id: string;
    type: 'job' | 'nft_listing';
    title?: string;
    description?: string;
    price?: number;
    nft_name?: string;
    nft_description?: string;
    image_url?: string;
    // ... other job/listing specific fields
}

export const JobMarketplace = () => {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);

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

  const loadMarketplaceItems = async () => {
    if (!isAuthenticated) {
      setError("Please login to view marketplace items");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const [jobsResponse, listingsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/public`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/marketplace/listings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      ]);

      if (!jobsResponse.ok || !listingsResponse.ok) {
        throw new Error('Failed to load marketplace items');
      }

      const jobsData = await jobsResponse.json();
      const listingsData = await listingsResponse.json();

      const items = [
        ...jobsData.jobs.map((job: any) => ({
          ...job,
          type: 'job' as const
        })),
        ...listingsData.data.map((listing: any) => ({
          ...listing,
          type: 'nft_listing' as const
        }))
      ];

      setMarketplaceItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMarketplaceItems();
    }
  }, [isAuthenticated]);

  const handleApplyJob = async (jobId: string, applicationData: JobApplicationData) => {
    try {
      if (!user?.id) {
        throw new Error('Please login to apply for jobs');
      }

      console.log('Submitting application with data:', {
        userId: user.id,
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
        throw new Error(data.message || 'Failed to apply for job');
      }

      // Navigate to jobs dashboard after successful application
      window.location.href = '/jobs';
      
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

  // Render function based on item type
  const renderMarketplaceItem = (item: MarketplaceItem) => {
    if (item.type === 'nft_listing') {
      return (
        <NFTListingCard 
          key={item.id}
          listing={item}
        />
      );
    }
    return (
      <JobCard 
        key={item.id}
        job={item as Job}
        onClick={handleJobClick}
      />
    );
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Browse available jobs and NFT listings</p>
        </div>

        {isLoading ? (
          <div>Loading marketplace items...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceItems.map(renderMarketplaceItem)}
          </div>
        )}

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