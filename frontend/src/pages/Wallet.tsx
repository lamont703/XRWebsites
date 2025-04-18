import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import { NFTGallery } from '@/components/features/wallet/NFTGallery';
import { FundWallet } from '@/components/features/wallet/FundWallet';
import { BuyVisorcoin } from '@/components/features/wallet/BuyVisorcoin';
import { SendReceiveVisorcoin } from '@/components/features/wallet/SendReceiveVisorcoin';
import { RecentTransactions } from '@/components/features/wallet/RecentTransactions';
import type User from '../types/user';
import styles from '@/styles/Wallet.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '../components/features/wallet/ConnectWallet';

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
  type: 'send' | 'receive' | 'stake' | 'unstake' | 'reward' | 'fee';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  counterparty?: string;
  description?: string;
}

interface TransactionStats {
  totalSent: number;
  totalReceived: number;
  largestTransaction: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  datePosted: string;
  dateCompleted?: string;
  applicants?: number;
}

export const Wallet = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { user } = useAuth() as { user: User | null };
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [nfts, setNfts] = useState([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'nfts' | 'jobs' | 'transactions'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);

  useEffect(() => {
    // Show connect prompt if no wallet is connected
    if (!wallet.connected) {
      setShowConnectPrompt(true);
    } else {
      setShowConnectPrompt(false);
      loadWalletData();
      loadNFTs();
      loadJobs();
    }
  }, [wallet.connected]);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      // Mock data for demonstration
      const mockWalletData: WalletData = {
        balance: '1,245.32',
        totalTokens: 5000,
        pendingTransactions: 2,
        totalValueLocked: '320.50',
        id: '1',
        transactions: [],
        recentTransactions: [
          {
            id: '1',
            type: 'receive',
            amount: 250,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed',
            counterparty: 'Reward Center',
            description: 'Mission completion reward'
          },
          {
            id: '2',
            type: 'stake',
            amount: 1000,
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            status: 'completed',
            description: 'Staked in Medium Orbit'
          },
          {
            id: '3',
            type: 'receive',
            amount: 500,
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            status: 'completed',
            counterparty: 'Job Marketplace',
            description: 'Payment for completed task'
          }
        ],
        transactionStats: {
          totalSent: 1500,
          totalReceived: 3500,
          largestTransaction: 1000
        }
      };
      
      setWalletData(mockWalletData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNFTs = async () => {
    try {
      setIsLoadingNFTs(true);
      // Mock NFT data
      const mockNFTs = [
        {
          id: '1',
          name: 'Key To The New Earth',
          image: '/images/nfts/key-to-new-earth.png',
          description: 'Your spiritual and technological passport to the New Earth ecosystem.',
          attributes: [
            { trait_type: 'Type', value: 'Access Key' },
            { trait_type: 'Rarity', value: 'Common' },
            { trait_type: 'Transferable', value: 'No' }
          ]
        },
        {
          id: '2',
          name: 'Orbital Engineer Badge',
          image: '/images/nfts/orbital-engineer.png',
          description: 'Awarded for participating in the Orbital Staking Protocol.',
          attributes: [
            { trait_type: 'Type', value: 'Achievement' },
            { trait_type: 'Rarity', value: 'Uncommon' },
            { trait_type: 'Transferable', value: 'No' }
          ]
        }
      ];
      
      setNfts(mockNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true);
      // Mock job data
      const mockPostedJobs = [
        {
          id: '1',
          title: 'Smart Contract Development',
          description: 'Develop a smart contract for token distribution',
          reward: 500,
          status: 'completed',
          datePosted: new Date(Date.now() - 1209600000).toISOString(),
          dateCompleted: new Date(Date.now() - 604800000).toISOString(),
          applicants: 5
        },
        {
          id: '2',
          title: 'UI Design for Dashboard',
          description: 'Create UI mockups for a new dashboard feature',
          reward: 300,
          status: 'open',
          datePosted: new Date(Date.now() - 259200000).toISOString(),
          applicants: 2
        }
      ] as Job[];
      
      const mockAcceptedJobs = [
        {
          id: '3',
          title: 'API Integration',
          description: 'Integrate third-party API with our platform',
          reward: 450,
          status: 'in-progress',
          datePosted: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: '4',
          title: 'Documentation Update',
          description: 'Update technical documentation for recent changes',
          reward: 200,
          status: 'completed',
          datePosted: new Date(Date.now() - 864000000).toISOString(),
          dateCompleted: new Date(Date.now() - 172800000).toISOString()
        }
      ] as Job[];
      
      setPostedJobs(mockPostedJobs);
      setAcceptedJobs(mockAcceptedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderJobStatus = (status: Job['status']) => {
    switch (status) {
      case 'open':
        return <span className={`${styles.statusBadge} ${styles.statusOpen}`}>Open</span>;
      case 'in-progress':
        return <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>In Progress</span>;
      case 'completed':
        return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Completed</span>;
      case 'cancelled':
        return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>Cancelled</span>;
      default:
        return null;
    }
  };

  if (showConnectPrompt) {
    return (
      <MainLayout>
        <div className={styles.connectPromptContainer}>
          <div className={styles.promptContent}>
            <h2>Complete Your Setup</h2>
            <div className={styles.benefitsList}>
              <h3>Why Connect Your Wallet?</h3>
              <ul>
                <li>✨ Access exclusive bounties</li>
                <li>💰 Earn tokens for contributions</li>
                <li>🤝 Participate in the community</li>
                <li>📈 Track your earnings and rewards</li>
              </ul>
            </div>
            
            <ConnectWallet 
              onConnect={async (address) => {
                await loadWalletData();
                setShowConnectPrompt(false);
              }}
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading || !walletData) {
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
      <div className={styles.walletContainer}>
        <div className={styles.walletHeader}>
          <h1 className={styles.walletTitle}>
            <span className={styles.walletIcon}>💰</span> 
            Wallet
          </h1>
          <p className={styles.walletSubtitle}>
            Manage your digital assets and transactions
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        <div className={styles.walletTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'nfts' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('nfts')}
          >
            NFTs
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'jobs' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'transactions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>
        
        {activeTab === 'overview' && (
          <div className={styles.overviewSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💎</div>
                <div className={styles.statLabel}>Total Visorcoin (XRV)</div>
                <div className={styles.statValue}>{walletData.totalTokens}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statLabel}>Total Value</div>
                <div className={styles.statValue}>${walletData.balance}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔒</div>
                <div className={styles.statLabel}>Value Locked</div>
                <div className={styles.statValue}>${walletData.totalValueLocked}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏳</div>
                <div className={styles.statLabel}>Pending Transactions</div>
                <div className={styles.statValue}>{walletData.pendingTransactions}</div>
              </div>
            </div>
            
            <div className={styles.quickActions}>
              <h2>Quick Actions</h2>
              <div className={styles.actionsGrid}>
                <button className={styles.actionButton} onClick={() => navigate('/staking')}>
                  <span className={styles.actionIcon}>🌌</span>
                  <span className={styles.actionText}>Stake Tokens</span>
                </button>
                <button className={styles.actionButton} onClick={() => navigate('/rewards')}>
                  <span className={styles.actionIcon}>🏆</span>
                  <span className={styles.actionText}>View Rewards</span>
                </button>
                <button className={styles.actionButton} onClick={() => navigate('/jobs')}>
                  <span className={styles.actionIcon}>💼</span>
                  <span className={styles.actionText}>Browse Jobs</span>
                </button>
                <button className={styles.actionButton} onClick={() => setActiveTab('nfts')}>
                  <span className={styles.actionIcon}>🖼️</span>
                  <span className={styles.actionText}>View NFTs</span>
                </button>
              </div>
            </div>
            
            <div className={styles.recentActivity}>
              <h2>Recent Activity</h2>
              <div className={styles.activityList}>
                {walletData.recentTransactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {tx.type === 'receive' ? '📥' : 
                       tx.type === 'send' ? '📤' : 
                       tx.type === 'stake' ? '🔒' : 
                       tx.type === 'unstake' ? '🔓' : 
                       tx.type === 'reward' ? '🏆' : '💸'}
                    </div>
                    <div className={styles.activityDetails}>
                      <div className={styles.activityTitle}>{tx.description}</div>
                      <div className={styles.activityMeta}>
                        {formatDate(tx.timestamp)} • {tx.status}
                      </div>
                    </div>
                    <div className={styles.activityAmount}>
                      {tx.type === 'receive' || tx.type === 'unstake' || tx.type === 'reward' ? '+' : '-'}
                      {tx.amount} XRV
                    </div>
                  </div>
                ))}
                <button 
                  className={styles.viewAllButton}
                  onClick={() => setActiveTab('transactions')}
                >
                  View All Transactions
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'nfts' && (
          <div className={styles.nftsSection}>
            <h2>Your NFT Collection</h2>
            {isLoadingNFTs ? (
              <div className={styles.loadingIndicator}>Loading your NFTs...</div>
            ) : nfts.length > 0 ? (
              <div className={styles.nftGrid}>
                {nfts.map((nft: any) => (
                  <div key={nft.id} className={styles.nftCard}>
                    <div className={styles.nftImageContainer}>
                      <img src={nft.image} alt={nft.name} className={styles.nftImage} />
                    </div>
                    <div className={styles.nftDetails}>
                      <h3 className={styles.nftName}>{nft.name}</h3>
                      <p className={styles.nftDescription}>{nft.description}</p>
                      <div className={styles.nftAttributes}>
                        {nft.attributes.map((attr: any, index: number) => (
                          <div key={index} className={styles.nftAttribute}>
                            <span className={styles.attributeType}>{attr.trait_type}:</span>
                            <span className={styles.attributeValue}>{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>🖼️</div>
                <p>You don't have any NFTs yet</p>
                <button 
                  className={styles.emptyStateButton}
                  onClick={() => navigate('/rewards')}
                >
                  Earn Your First NFT
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'jobs' && (
          <div className={styles.jobsSection}>
            <div className={styles.jobsTabHeader}>
              <h2>Your Job History</h2>
              <button 
                className={styles.browseJobsButton}
                onClick={() => navigate('/jobs')}
              >
                Browse Available Jobs
              </button>
            </div>
            
            <div className={styles.jobsContainer}>
              <div className={styles.jobsColumn}>
                <h3>Posted Jobs</h3>
                {isLoadingJobs ? (
                  <div className={styles.loadingIndicator}>Loading jobs...</div>
                ) : postedJobs.length > 0 ? (
                  <div className={styles.jobsList}>
                    {postedJobs.map(job => (
                      <div key={job.id} className={styles.jobCard}>
                        <div className={styles.jobHeader}>
                          <h4 className={styles.jobTitle}>{job.title}</h4>
                          {renderJobStatus(job.status)}
                        </div>
                        <p className={styles.jobDescription}>{job.description}</p>
                        <div className={styles.jobMeta}>
                          <div className={styles.jobReward}>{job.reward} XRV</div>
                          <div className={styles.jobDate}>
                            Posted: {formatDate(job.datePosted)}
                            {job.dateCompleted && ` • Completed: ${formatDate(job.dateCompleted)}`}
                          </div>
                          {job.applicants && (
                            <div className={styles.jobApplicants}>
                              {job.applicants} applicant{job.applicants !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📋</div>
                    <p>You haven't posted any jobs yet</p>
                    <button 
                      className={styles.emptyStateButton}
                      onClick={() => navigate('/jobs/create')}
                    >
                      Post a Job
                    </button>
                  </div>
                )}
              </div>
              
              <div className={styles.jobsColumn}>
                <h3>Accepted Jobs</h3>
                {isLoadingJobs ? (
                  <div className={styles.loadingIndicator}>Loading jobs...</div>
                ) : acceptedJobs.length > 0 ? (
                  <div className={styles.jobsList}>
                    {acceptedJobs.map(job => (
                      <div key={job.id} className={styles.jobCard}>
                        <div className={styles.jobHeader}>
                          <h4 className={styles.jobTitle}>{job.title}</h4>
                          {renderJobStatus(job.status)}
                        </div>
                        <p className={styles.jobDescription}>{job.description}</p>
                        <div className={styles.jobMeta}>
                          <div className={styles.jobReward}>{job.reward} XRV</div>
                          <div className={styles.jobDate}>
                            Started: {formatDate(job.datePosted)}
                            {job.dateCompleted && ` • Completed: ${formatDate(job.dateCompleted)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>🔍</div>
                    <p>You haven't accepted any jobs yet</p>
                    <button 
                      className={styles.emptyStateButton}
                      onClick={() => navigate('/jobs')}
                    >
                      Find Jobs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'transactions' && (
          <div className={styles.transactionsSection}>
            <h2>Transaction History</h2>
            {walletData.recentTransactions.length > 0 ? (
              <div className={styles.transactionsList}>
                {walletData.recentTransactions.map(tx => (
                  <div key={tx.id} className={styles.transactionItem}>
                    <div className={styles.transactionIcon}>
                      {tx.type === 'receive' ? '📥' : 
                       tx.type === 'send' ? '📤' : 
                       tx.type === 'stake' ? '🔒' : 
                       tx.type === 'unstake' ? '🔓' : 
                       tx.type === 'reward' ? '🏆' : '💸'}
                    </div>
                    <div className={styles.transactionDetails}>
                      <div className={styles.transactionTitle}>{tx.description}</div>
                      <div className={styles.transactionMeta}>
                        {tx.counterparty && <span>From: {tx.counterparty} • </span>}
                        {formatDate(tx.timestamp)} • {tx.status}
                      </div>
                    </div>
                    <div className={`${styles.transactionAmount} ${
                      tx.type === 'receive' || tx.type === 'unstake' || tx.type === 'reward' 
                        ? styles.positive 
                        : styles.negative
                    }`}>
                      {tx.type === 'receive' || tx.type === 'unstake' || tx.type === 'reward' ? '+' : '-'}
                      {tx.amount} XRV
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📊</div>
                <p>No transactions yet</p>
              </div>
            )}
            
            {walletData.transactionStats && (
              <div className={styles.transactionStats}>
                <h3>Transaction Summary</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>Total Received</div>
                    <div className={styles.statValue}>+{walletData.transactionStats.totalReceived} XRV</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>Total Sent</div>
                    <div className={styles.statValue}>-{walletData.transactionStats.totalSent} XRV</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>Largest Transaction</div>
                    <div className={styles.statValue}>{walletData.transactionStats.largestTransaction} XRV</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 