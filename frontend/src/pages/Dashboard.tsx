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
  transactions: Transaction[];
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData>({ id: '', balance: '0.00', transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setWalletData(prev => ({ 
        ...prev, 
        id: data.id, 
        balance: data.balance.toString(),
        transactions: []
      }));
      return data.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
      return null;
    }
  };

  const loadTransactions = async (walletId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletId}/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const { data } = await response.json();
      setWalletData(prev => ({ 
        ...prev, 
        transactions: Array.isArray(data) ? data : [] 
      }));
    } catch (err) {
      console.error('Transaction loading error:', err);
      setWalletData(prev => ({ ...prev, transactions: [] }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      const walletId = await loadWalletData();
      if (walletId) {
        await loadTransactions(walletId);
      } else {
        setIsLoading(false);
      }
    };
    initializeDashboard();
  }, []);

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
            <div className="text-2xl font-bold text-white">0</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Active Jobs</div>
            <div className="text-2xl font-bold text-white">0</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Wallet Balance</div>
            <div className="text-2xl font-bold text-white">${walletData.balance}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-sm font-medium text-gray-400 mb-2">Total Earnings</div>
            <div className="text-2xl font-bold text-white">$0.00</div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-gray-400">Loading transactions...</span>
            </div>
          ) : walletData.transactions.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No recent transactions to show.
            </div>
          ) : (
            <div className="space-y-4">
              {walletData.transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded ${
                      transaction.type === 'receive' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {transaction.type === 'receive' ? '+' : '-'}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {transaction.type === 'receive' ? 'Received' : 'Sent'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${transaction.amount}</div>
                    <div className={`text-sm ${
                      transaction.status === 'completed' ? 'text-green-400' :
                      transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 