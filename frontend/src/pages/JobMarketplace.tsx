import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobDetails } from '@/components/features/jobs/JobDetails';
import { useAuth } from '@/store/auth/Auth';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { JobApplicationData } from '@/components/features/jobs/JobApplication';
import { JobCard } from '@/components/features/jobs/JobCard';
import { NFTListingCard } from '@/components/features/marketplace/NFTListingCard';
import styles from '@/styles/JobMarketplace.module.css';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';

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
  const navigate = useNavigate();
  const wallet = useWallet();

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

      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      // Add pagination parameters
      params.append('page', '1');
      params.append('limit', '20');

      // Log the URLs we're fetching from to verify
      console.log('Fetching jobs from:', `${import.meta.env.VITE_BACKEND_API_URL}/jobs?${params}`);
      console.log('Fetching listings from:', `${import.meta.env.VITE_BACKEND_API_URL}/marketplace/listings?${params}`);

      const [jobsResponse, listingsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`${import.meta.env.VITE_BACKEND_API_URL}/marketplace/listings?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      ]);

      // Log the response status to check if they're successful
      console.log('Jobs response status:', jobsResponse.status);
      console.log('Listings response status:', listingsResponse.status);

      // Process jobs if response is OK
      let jobItems = [];
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        console.log('Jobs data:', jobsData);
        
        // Handle different response structures
        const jobs = jobsData.data || jobsData || [];
        
        if (Array.isArray(jobs)) {
          // Transform jobs to MarketplaceItem format
          jobItems = jobs.map(job => ({
            id: job.id,
            type: 'job',
            title: job.title,
            description: job.description,
            price: job.budget,  // Note: changed from price to budget based on controller
            skills: job.required_skills || [],  // Note: changed from skills to required_skills
            experienceLevel: job.experienceLevel || 'beginner',
            location: job.location || 'Remote',
            postedDate: job.createdAt,
            poster: {
              id: job.business_id,
              name: job.business_name || 'Anonymous',
              rating: job.business_rating || 0
            },
            status: job.status || 'open',
            createdAt: job.createdAt
          }));
        } else {
          console.warn('Jobs data is not an array:', jobs);
        }
      }

      // Process listings if response is OK
      let nftItems = [];
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        console.log('Listings data:', listingsData);
        
        // Handle different response structures
        const listings = listingsData.data || listingsData || [];
        
        if (Array.isArray(listings)) {
          // Transform NFT listings to MarketplaceItem format
          nftItems = listings.map(listing => ({
            id: listing.id,
            type: 'nft_listing',
            nft_name: listing.nft?.name || listing.nft_name,
            nft_description: listing.nft?.description || listing.nft_description,
            image_url: listing.nft?.image_url || listing.image_url,
            price: listing.price
          }));
        } else {
          console.warn('Listings data is not an array:', listings);
        }
      }

      // Combine both types of items
      const combinedItems = [...jobItems, ...nftItems];
      setMarketplaceItems(combinedItems);
      console.log('Combined marketplace items:', combinedItems);

      // If there's a job, select the first one by default for desktop view
      if (jobItems.length > 0) {
        setSelectedJob(jobItems[0] as Job);
      }
    } catch (error) {
      console.error('Error loading marketplace items:', error);
      setError('Failed to load marketplace items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMarketplaceItems();
    }
  }, [isAuthenticated, selectedCategory]);

  useEffect(() => {
    console.log('Current marketplace items:', marketplaceItems);
  }, [marketplaceItems]);

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
        <div 
          key={item.id} 
          className={styles.missionCard}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>🖼️</div>
            <div className={styles.cardBadge}>Asset</div>
          </div>
          
          <h3 className={styles.cardTitle}>
            {item.nft_name || 'Unnamed NFT'}
          </h3>
          
          <p className={styles.cardDescription}>
            {item.nft_description || 'No description available'}
          </p>
          
          {item.image_url && (
            <div className={styles.nftImageContainer}>
              <img 
                src={item.image_url} 
                alt={item.nft_name || 'NFT'} 
                className={styles.nftImage}
              />
            </div>
          )}
          
          <div className={styles.cardFooter}>
            <div className={styles.cardPrice}>
              {item.price ? `${item.price} USDC` : 'Price on request'}
            </div>
            <button className={styles.cardAction}>
              View Asset
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        key={item.id} 
        className={`${styles.missionCard} ${
          selectedJob?.id === item.id ? styles.activeCard : ''
        }`}
        onClick={() => handleJobClick(item as Job)}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>💼</div>
          <div className={styles.cardBadge}>Mission</div>
        </div>
        
        <h3 className={styles.cardTitle}>
          {item.title || 'Unnamed Mission'}
        </h3>
        
        <p className={styles.cardDescription}>
          {item.description || 'No description available'}
        </p>
        
        <div className={styles.cardFooter}>
          <div className={styles.cardPrice}>
            {item.price ? `${item.price} USDC` : 'Price on request'}
          </div>
          <button className={styles.cardAction}>
            View Mission
          </button>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className={styles.marketplaceContainer}>
        <div className={styles.marketplaceHeader}>
          <h1 className={styles.marketplaceTitle}>
            <span className={styles.marketplaceIcon}>💼</span> 
            Job Marketplace
          </h1>
          <p className={styles.marketplaceSubtitle}>
            Find opportunities or post jobs in our community marketplace
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        <div className={styles.container}>
          <div className={styles.missionHeader}>
            <h1 className={styles.missionTitle}>
              <span className={styles.missionIcon}>💼</span> 
              Mission Opportunities Hub
            </h1>
            <div className={styles.missionStatus}>
              Status: <span className={isLoading ? styles.statusPending : styles.statusReady}>
                {isLoading ? 'Scanning Network' : 'Opportunities Available'}
              </span>
            </div>
          </div>

          <div className={styles.controlPanel}>
            <div className={styles.controlModule}>
              <div className={styles.controlModuleHeader}>
                <h3>Mission Parameters</h3>
              </div>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Scan for missions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.controlInput}
                />
                <button className={styles.scanButton}>
                  <span className={styles.scanIcon}>🔍</span>
                </button>
              </div>
            </div>
            
            <div className={styles.controlModule}>
              <div className={styles.controlModuleHeader}>
                <h3>Mission Filters</h3>
              </div>
              <div className={styles.filterControls}>
                <div className={styles.controlField}>
                  <div className={styles.fieldHeader}>
                    <span className={styles.fieldLabel}>Mission Type</span>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.controlInput}
                  >
                    <option value="all">All Missions</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className={styles.controlField}>
                  <div className={styles.fieldHeader}>
                    <span className={styles.fieldLabel}>Reward Range</span>
                  </div>
                  <div className={styles.rangeInputs}>
                    <input
                      type="number"
                      placeholder="Min"
                      className={styles.controlInput}
                    />
                    <span className={styles.rangeSeparator}>to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className={styles.controlInput}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mainContent}>
            <div className={styles.filtersContainer}>
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Categories</h3>
                <div className={styles.filterGroup}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.select}
                    title="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Price Range</h3>
                <div className={styles.priceInputs}>
                  <input
                    type="number"
                    placeholder="Min"
                    className={styles.priceInput}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className={styles.priceInput}
                  />
                </div>
              </div>
            </div>

            <div>
              {isLoading ? (
                <div className={styles.loadingText}>Scanning for missions...</div>
              ) : error ? (
                <div className={styles.errorText}>{error}</div>
              ) : marketplaceItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>🔍</div>
                  <h3 className={styles.emptyStateTitle}>No Missions Found</h3>
                  <p className={styles.emptyStateMessage}>
                    There are currently no missions available matching your criteria. 
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              ) : (
                <div className={styles.missionCardsGrid}>
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
      </div>
    </MainLayout>
  );
}; 