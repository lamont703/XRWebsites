import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobDetails } from '@/components/features/jobs/JobDetails';
import { useAuth } from '@/store/auth/Auth';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { JobApplicationData } from '@/components/features/jobs/JobApplication';
import {} from '../styles/Dashboard.module.css'
import {} from '@/components/features/marketplace/NFTListings';
import {} from '@/components/features/jobs/ActiveJobs';
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
  createdAt: string;
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
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
      await loadMarketplaceItems();
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
          listing={item as { id: string; nft_name?: string; nft_description?: string; image_url?: string; price: number }}
        />
      );
    }
    if (!('skills' in item) || !('experienceLevel' in item)) {
      return null; // Skip rendering if it's not a proper job
    }
    return (
      <JobCard 
        key={item.id}
        job={{
          id: item.id,
          title: item.title || '',
          description: item.description || '',
          price: item.price || 0,
          experienceLevel: 'beginner',
          location: '',
          poster: {
            name: '',
            rating: 0
          },
          createdAt: new Date().toISOString()
        }}
        onClick={handleJobClick}
      />
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for jobs..."
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Section - Full width on mobile, sidebar on desktop */}
        <div className="lg:flex lg:gap-8">
          <div className="w-full lg:w-1/4 mb-6 lg:mb-0">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Filters</h2>
              
              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-white">Category</h3>
                <select
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="web">Web Development</option>
                  <option value="mobile">Mobile Development</option>
                  <option value="design">UI/UX Design</option>
                  <option value="writing">Content Writing</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-white">Experience Level</h3>
                <div className="space-y-2 text-white">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> Entry Level
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> Intermediate
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> Expert
                  </label>
                </div>
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-white">Hourly Rate</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 p-2 rounded bg-gray-700 text-white border border-gray-600"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 p-2 rounded bg-gray-700 text-white border border-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Job Listings */}
          <div className="w-full lg:w-3/4">
            {isLoading ? (
              <div>Loading marketplace items...</div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceItems.map(renderMarketplaceItem)}
              </div>
            )}
          </div>
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