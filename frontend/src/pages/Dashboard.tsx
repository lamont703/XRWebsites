import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import styles from '../styles/Dashboard.module.css';


interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

interface WalletData {
  id: string;
  balance: string;
  totalTokens: number;
  transactions: Transaction[];
  stats?: {
    total: number;
    purchases: number;
    sales: number;
    transfers: number;
  };
}

interface DashboardStats {
  totalNFTs: number;
  activeJobs: number;
}

interface RecentActivity {
  assets: Array<{
    id: string;
    name: string;
    type: string;
    createdAt: string;
  }>;
  jobPostings: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  jobApplications: Array<{
    id: string;
    jobTitle: string;
    status: string;
    appliedAt: string;
  }>;
  forumActivity: Array<{
    id: string;
    title: string;
    type: 'post' | 'comment';
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    createdAt: string;
  }>;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalNFTs: 0,
    activeJobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData>({ 
    id: '', 
    balance: '0.00',
    totalTokens: 0,
    transactions: [] 
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    assets: [],
    jobPostings: [],
    jobApplications: [],
    forumActivity: [],
    reviews: []
  });
  const [error, setError] = useState<string | null>(null);

  // Add safe default stats
  const defaultStats = {
    total: 0,
    purchases: 0,
    sales: 0,
    transfers: 0
  };

  // Ensure stats object exists before using Object.entries
  const walletStats = walletData?.stats || defaultStats;
  const statEntries = Object.entries(walletStats);

  const loadWalletData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load wallet data');
      }

      const { data } = await response.json();
      
      // Ensure data exists and has required properties
      if (!data || typeof data.balance === 'undefined') {
        throw new Error('Invalid wallet data received');
      }

      // Update wallet data with safe defaults
      setWalletData({
        id: data.id || '',
        balance: (data.balance || 0).toString(),
        totalTokens: data.linked_accounts?.length || 0,
        transactions: data.transactions || [],
        stats: data.stats || {
          total: 0,
          purchases: 0,
          sales: 0,
          transfers: 0
        }
      });

      return data.id;
    } catch (err) {
      console.error('Error loading wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
      return null;
    }
  };

  const loadDashboardStats = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setRecentActivity(data.data.recentActivity);

      // Get active jobs count
      const jobsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/jobs/user/${user.id}/active`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        }
      );

      // Get NFTs through wallet
      const walletId = await loadWalletData();
      let nftsCount = 0;

      if (walletId) {
        try {
          const nftsResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletId}/nfts`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Accept': 'application/json'
              },
              credentials: 'include'
            }
          );

          if (nftsResponse.ok) {
            const nftsData = await nftsResponse.json();
            const nfts = nftsData.data?.nfts || nftsData.data || [];
            nftsCount = Array.isArray(nfts) ? nfts.length : 0;
          }
        } catch (error) {
          console.error('Error fetching NFTs:', error);
          // Continue with dashboard loading despite NFT error
        }
      }

      const jobsData = await jobsResponse.json();

      setStats({
        activeJobs: jobsData.data.jobs?.length || 0,
        totalNFTs: nftsCount
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [user?.id]);

  return (
    <MainLayout>
      <div className={styles.dashboardContainer}>
        {/* Welcome Section */}
        <div className={styles.welcomeCard}>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your XRWebsites account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Total NFTs</div>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.totalNFTs}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Active Jobs</div>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.activeJobs}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Wallet Balance (USD)</div>
            <div className="text-2xl font-bold text-white">
              ${isLoading ? '...' : walletData.balance}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Visorcoin Balance (XRV)</div>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : walletData.totalTokens} XRV
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className={styles.card}>
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-gray-400">Loading activity...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(recentActivity || {}).map(([category, items]) => (
                Array.isArray(items) && items.length > 0 && (
                  <div key={category} className="space-y-4">
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div 
                          key={item?.id || Math.random()} 
                          className={styles.card}
                        >
                          <div>
                            <div className="text-white">
                              {item?.title || item?.name || `${category} Activity`}
                            </div>
                            <div className="text-sm text-gray-400">
                              {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'No date'}
                            </div>
                          </div>
                          {item?.status && (
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              {(!recentActivity || Object.values(recentActivity).every(items => !Array.isArray(items) || items.length === 0)) && (
                <div className={styles.emptyState}>
                  No recent activity to show.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 