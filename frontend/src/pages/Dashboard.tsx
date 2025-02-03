import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '../store/auth/AuthContext';
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
}

interface DashboardStats {
  totalNFTs: number;
  activeJobs: number;
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

  const loadWalletData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load wallet data');
      }

      const { data } = await response.json();
      setWalletData({ 
        id: data.id,
        balance: data.balance || '0.00',
        totalTokens: data.linked_accounts?.length || 0,
        transactions: data.transactions || []
      });
      return data.id;
    } catch (err) {
      console.error('Error loading wallet:', err);
      return null;
    }
  };

  const loadDashboardStats = async () => {
    if (!user?.id) return;

    try {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your XRWebsites account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Total NFTs</div>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.totalNFTs}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Active Jobs</div>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.activeJobs}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Wallet Balance (USD)</div>
            <div className="text-2xl font-bold text-white">
              ${isLoading ? '...' : walletData.balance}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Visorcoin Balance (XRV)</div>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : walletData.totalTokens} XRV
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-gray-400">Loading transactions...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              No recent transactions to show.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 