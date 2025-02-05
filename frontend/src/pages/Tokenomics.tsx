import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { useAuth } from '@/store/auth/Auth';
import styles from '../styles/Dashboard.module.css';

interface TokenMetrics {
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  holders: number;
  activeAddresses: number;
  transactions24h: number;
  stakingRatio: number;
}

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
};

export const Tokenomics = () => {
  const [metrics, setMetrics] = useState<TokenMetrics>({
    price: 0,
    marketCap: 0,
    volume24h: 0,
    circulatingSupply: 0,
    totalSupply: 0,
    holders: 0,
    activeAddresses: 0,
    transactions24h: 0,
    stakingRatio: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch token metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tokenomics/metrics/${tokenId}`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load token metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <MainLayout>
      <div className="w-full max-w-[100vw] overflow-x-hidden px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Token Analytics</h1>
          <p className="text-gray-400">Comprehensive analytics for your token</p>
        </div>

        {/* Key Metrics Grid - Similar to Assets.tsx styling */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-400 mb-2">Current Price</div>
            <div className="text-2xl font-bold text-white">${metrics.price.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-400 mb-2">Market Cap</div>
            <div className="text-2xl font-bold text-white">${formatNumber(metrics.marketCap)}</div>
          </div>
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-400 mb-2">24h Volume</div>
            <div className="text-2xl font-bold text-white">${formatNumber(metrics.volume24h)}</div>
          </div>
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-400 mb-2">Holders</div>
            <div className="text-2xl font-bold text-white">{metrics.holders.toLocaleString()}</div>
          </div>
        </div>

        {/* Supply Metrics - Using Dashboard.tsx card styling */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Supply Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">Circulating Supply</div>
              <div className="text-lg font-bold text-white">
                {formatNumber(metrics.circulatingSupply)} tokens
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Supply</div>
              <div className="text-lg font-bold text-white">
                {formatNumber(metrics.totalSupply)} tokens
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Staking Ratio</div>
              <div className="text-lg font-bold text-white">
                {metrics.stakingRatio.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Market Activity Chart - Similar to Dashboard transaction styling */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Price History</h2>
          <div className="h-[400px]">
            <LineChart data={[]} /> {/* Implement chart component */}
          </div>
        </div>

        {/* Token Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Token Distribution</h2>
          <div className="h-[300px]">
            <BarChart data={[]} /> {/* Implement chart component */}
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Network Activity</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Addresses (24h)</span>
                <span className="text-white font-bold">{metrics.activeAddresses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Transactions (24h)</span>
                <span className="text-white font-bold">{metrics.transactions24h}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Holder Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Holders</span>
                <span className="text-white font-bold">{metrics.holders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Staking Participants</span>
                <span className="text-white font-bold">
                  {Math.floor(metrics.holders * (metrics.stakingRatio / 100))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 