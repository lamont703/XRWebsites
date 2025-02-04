import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/useAuth';
import { NFTGallery } from '@/components/features/wallet/NFTGallery';
import styles from '../styles/Dashboard.module.css';
import { FundWallet } from '@/components/features/wallet/FundWallet';
import { BuyVisorcoin } from '@/components/features/wallet/BuyVisorcoin';
import { SendReceiveVisorcoin } from '@/components/features/wallet/SendReceiveVisorcoin';
import { RecentTransactions } from '@/components/features/wallet/RecentTransactions';



interface WalletData {
  balance: string;
  totalTokens: number;
  pendingTransactions: number;
  totalValueLocked: string;
  transactions: Transaction[];
  id: string;
  recentTransactions: Transaction[];
  transactionStats?: TransactionStats;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

interface TransactionStats {
  total: number;
  purchases: number;
  sales: number;
  transfers: number;
}


export const Wallet = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: '0.00',
    totalTokens: 0,
    pendingTransactions: 0,
    totalValueLocked: '0.00',
    transactions: [],
    recentTransactions: [],
    id: '',
    transactionStats: {
      total: 0,
      purchases: 0,
      sales: 0,
      transfers: 0
    }
  });
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = async () => {
    console.log('🔄 Loading wallet data...');
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('📡 Wallet API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Wallet not found, creating new wallet...');
          await createNewWallet();
          return loadWalletData();
        }
        throw new Error('Failed to load wallet data');
      }

      const { data } = await response.json();
      console.log('💰 Received wallet data:', data);
      
      setWalletData({
        balance: data.balance.toString(),
        totalTokens: data.linked_accounts?.length || 0,
        pendingTransactions: 0,
        totalValueLocked: data.balance.toString(),
        transactions: [],
        id: data.id,
        recentTransactions: [],
        transactionStats: data.stats
      });
      console.log('✅ Wallet data updated in state');
    } catch (err) {
      console.error('❌ Failed to load wallet data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNFTs = async (walletId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletId}/nfts`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load NFTs');
      }

      const { data } = await response.json();
      console.log('NFT Data:', data); // Debug log
      setNfts(Array.isArray(data) ? data : data.nfts || []);
    } catch (err) {
      console.error('NFT loading error:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Failed to load NFTs');
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const createNewWallet = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          currency: 'USD',
          type: 'wallet'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create wallet');
      }

      return response.json();
    } catch (err) {
      throw new Error('Failed to create wallet');
    }
  };

  const connectExternalWallet = async (address: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/${walletData.id}/connect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            external_wallet_address: address,
            wallet_type: 'ethereum'
          }),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to connect external wallet');
      }

      // Reload wallet data after connecting
      await loadWalletData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleFundWallet = async (amount: number) => {
    console.log('🔄 Starting wallet update process for amount:', amount);
    try {
        console.log('⏳ Waiting for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔄 Reloading wallet data...');
        await loadWalletData();
        console.log('✅ Wallet data reloaded successfully');
    } catch (err) {
        console.error('❌ Error updating wallet after funding:', err);
        setError('Payment successful. Wallet balance will update shortly.');
    }
  };

  const handleBuyVisorcoin = async (amount: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletData.id}/buy-visorcoin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ amount }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to purchase Visorcoin');
      }

      // Reload wallet data after successful purchase
      await loadWalletData();
    } catch (err) {
      throw new Error('Failed to purchase Visorcoin');
    }
  };

  const handleSendVisorcoin = async (recipientAddress: string, amount: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletData.id}/send-visorcoin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ recipientAddress, amount }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to send Visorcoin');
      }

      // Reload wallet data after successful transfer
      await loadWalletData();
    } catch (err) {
      throw new Error('Failed to send Visorcoin');
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletData.id}/recent-transactions`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load recent transactions');
      }

      const { data } = await response.json();
      setWalletData(prev => ({
        ...prev,
        recentTransactions: data.transactions,
        transactionStats: data.stats
      }));
    } catch (err) {
      console.error('Error loading recent transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent transactions');
    }
  };

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await loadWalletData();
        if (walletData.id) {
          await Promise.all([
            loadNFTs(walletData.id),
            loadRecentTransactions()
          ]);
        }
      } catch (error) {
        setError('Failed to initialize wallet');
      }
    };

    initializeWallet();
  }, [walletData.id]);

  return (
    <MainLayout>
      <div className="w-full max-w-[100vw] overflow-x-hidden p-4 md:px-6 lg:px-8 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Wallet Overview</h1>
          <p className="text-sm md:text-base text-gray-400">Manage your crypto assets and transactions</p>
        </div>

        {/* Wallet Actions */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FundWallet 
                onFund={handleFundWallet} 
                walletId={walletData.id}
                className=""
            />
            <BuyVisorcoin onPurchase={handleBuyVisorcoin} />
          </div>
          
          <SendReceiveVisorcoin 
            onSend={handleSendVisorcoin}
            walletAddress={walletData.id}
          />
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm md:text-base">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-gray-800 rounded-lg p-4 md:p-6">
            <div className="text-xs md:text-sm font-medium text-gray-400 mb-1 md:mb-2">Total Dollars</div>
            <div className="text-lg md:text-2xl font-bold text-white">${walletData.balance}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 md:p-6">
            <div className="text-xs md:text-sm font-medium text-gray-400 mb-1 md:mb-2">Total Visorcoin (XRV)</div>
            <div className="text-lg md:text-2xl font-bold text-white">{walletData.totalTokens}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 md:p-6">
            <div className="text-xs md:text-sm font-medium text-gray-400 mb-1 md:mb-2">Pending Transactions</div>
            <div className="text-lg md:text-2xl font-bold text-white">{walletData.pendingTransactions}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 md:p-6">
            <div className="text-xs md:text-sm font-medium text-gray-400 mb-1 md:mb-2">Total Value Locked</div>
            <div className="text-lg md:text-2xl font-bold text-white">${walletData.totalValueLocked}</div>
          </div>
        </div>

        {/* NFTs Section */}
        <div className="space-y-4 md:space-y-6">
          <NFTGallery 
            nfts={nfts} 
            isLoading={isLoadingNFTs} 
            title="Your NFTs"
            compact={false}
          />
        </div>

        {/* Recent Transactions */}
        <RecentTransactions 
          transactions={walletData.recentTransactions || []}
          isLoading={isLoading}
          className="bg-gray-800 rounded-lg"
        />
      </div>
    </MainLayout>
  );
}; 