import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { NFTGallery } from '@/components/features/wallet/NFTGallery';
import { FundWallet } from '@/components/features/wallet/FundWallet';
import { BuyVisorcoin } from '@/components/features/wallet/BuyVisorcoin';
import { SendReceiveVisorcoin } from '@/components/features/wallet/SendReceiveVisorcoin';
import { RecentTransactions } from '@/components/features/wallet/RecentTransactions';
import type User from '../types/user';
import styles from '@/styles/Wallet.module.css';

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
  const {} = useAuth() as { user: User | null };
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

  /*const connectExternalWallet = async (address: string) => {
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
  };*/

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <h1 className={styles.title}>Wallet Overview</h1>
          <p className={styles.subtitle}>Manage your crypto assets and transactions</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Dollars</div>
            <div className={styles.statValue}>${walletData.balance}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Visorcoin (XRV)</div>
            <div className={styles.statValue}>{walletData.totalTokens}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending Transactions</div>
            <div className={styles.statValue}>{walletData.pendingTransactions}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Value Locked</div>
            <div className={styles.statValue}>${walletData.totalValueLocked}</div>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <div className={styles.actionsGrid}>
          <FundWallet 
            onFund={handleFundWallet} 
            walletId={walletData.id}
            className={styles.actionCard}
          />
          <BuyVisorcoin onPurchase={handleBuyVisorcoin} />
        </div>
        
        <SendReceiveVisorcoin 
          onSend={handleSendVisorcoin}
          walletAddress={walletData.id}
        />

        <div className={styles.nftSection}>
          <NFTGallery 
            nfts={nfts} 
            isLoading={isLoadingNFTs} 
            title="Your NFTs"
            compact={false}
          />
        </div>

        <RecentTransactions 
          transactions={walletData.recentTransactions || []}
          isLoading={isLoading}
          className={styles.transactionsCard}
        />
      </div>
    </MainLayout>
  );
}; 