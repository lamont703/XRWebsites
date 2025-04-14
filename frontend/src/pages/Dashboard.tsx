import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth/Auth';
import { MainLayout } from '@/components/layout/MainLayout';
import styles from '@/styles/Dashboard.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';

// Mission card interface
interface MissionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  status: 'available' | 'in-progress' | 'completed' | 'locked';
  highlight?: boolean;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [missionCards, setMissionCards] = useState<MissionCard[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    // Check if user has completed first steps mission
    const missionProgress = localStorage.getItem('firstStepsMissionProgress');
    if (missionProgress) {
      const progress = JSON.parse(missionProgress);
      const completedSteps = progress.completedSteps || [];
      setHasCompletedOnboarding(completedSteps.includes('claim-reward'));
    }

    // Load mission cards
    loadMissionCards();
    
    // Set up responsive screen size detection
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    // Initial call
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [wallet.connected]);

  const loadMissionCards = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, you might fetch this from an API
      // For now, we'll use static data
      const cards: MissionCard[] = [
        {
          id: 'rewards-center',
          title: 'Available Rewards',
          description: 'Explore reward journeys and claim tokens and NFTs',
          icon: '🏆',
          path: '/rewards',
          status: 'available',
          highlight: true
        },
        {
          id: 'token-presale',
          title: 'Token Pre-Sale',
          description: 'Get early access to our platform tokens at exclusive rates',
          icon: '🪙',
          path: '/tokenomics',
          status: 'available'
        },
        {
          id: 'create-token',
          title: 'Create Your Token',
          description: 'Launch your own token on Solana with our easy-to-use creator',
          icon: '✨',
          path: '/token-creator',
          status: wallet.connected ? 'available' : 'locked'
        },
        {
          id: 'job-marketplace',
          title: 'Job Marketplace',
          description: 'Find opportunities or post jobs in our community marketplace',
          icon: '💼',
          path: '/marketplace',
          status: 'available'
        },
        {
          id: 'nft-gallery',
          title: 'NFT Gallery',
          description: 'View your NFT collection including your Key To The New Earth',
          icon: '🖼️',
          path: '/nft-assets',
          status: hasCompletedOnboarding ? 'completed' : 'in-progress'
        },
        {
          id: 'community-forum',
          title: 'Community Forum',
          description: 'Connect with other members and share ideas',
          icon: '💬',
          path: '/forum',
          status: 'available'
        },
        {
          id: 'wallet-management',
          title: 'Wallet Management',
          description: 'Manage your digital assets and view transaction history',
          icon: '💰',
          path: '/wallet',
          status: wallet.connected ? 'available' : 'locked'
        }
      ];
      
      setMissionCards(cards);
    } catch (error) {
      console.error('Error loading mission cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (card: MissionCard) => {
    if (card.status !== 'locked') {
      navigate(card.path);
    } else {
      // If card is locked, show connect wallet prompt
      console.log('Please connect your wallet to access this feature');
    }
  };

  // Render status badge for each card
  const renderStatusBadge = (status: MissionCard['status']) => {
    switch (status) {
      case 'available':
        return <span className={`${styles.statusBadge} ${styles.available}`}>Available</span>;
      case 'in-progress':
        return <span className={`${styles.statusBadge} ${styles.inProgress}`}>In Progress</span>;
      case 'completed':
        return <span className={`${styles.statusBadge} ${styles.completed}`}>Completed</span>;
      case 'locked':
        return <span className={`${styles.statusBadge} ${styles.locked}`}>Connect Wallet</span>;
      default:
        return null;
    }
  };

  // Render a welcome message appropriate for the time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Welcome';
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    return `${greeting}, ${user?.name || 'Explorer'}`;
  };

  return (
    <MainLayout>
      <div className={styles.missionControlContainer}>
        <div className={styles.missionControlHeader}>
          <h1>Mission Control Center</h1>
          <p className={styles.welcomeMessage}>{getWelcomeMessage()}. Explore the opportunities below.</p>
        </div>

        {!wallet.connected && (
          <div className={styles.walletConnectBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>🔗</div>
              <div className={styles.bannerText}>
                <h3>Connect Your Wallet</h3>
                <p>Connect your wallet to access all features and track your progress</p>
              </div>
            </div>
            <div className={styles.bannerAction}>
              <ConnectWallet />
            </div>
          </div>
        )}

        <div className={styles.missionCardsGrid}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading mission cards...</p>
            </div>
          ) : (
            missionCards.map(card => (
              <div 
                key={card.id} 
                className={`${styles.missionCard} ${card.highlight ? styles.highlightCard : ''} ${card.status === 'locked' ? styles.lockedCard : ''}`}
                onClick={() => handleCardClick(card)}
                role="button"
                tabIndex={0}
                aria-label={card.title}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(card);
                  }
                }}
              >
                <div className={styles.cardIcon}>{card.icon}</div>
                <div className={styles.cardContent}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <div className={styles.cardFooter}>
                  {renderStatusBadge(card.status)}
                  <span className={styles.cardArrow}>→</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.platformStats}>
          <div className={styles.statCard}>
            <h4>Platform Stats</h4>
            <div className={styles.statGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Active Jobs</span>
                <span className={styles.statValue}>127</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Community Members</span>
                <span className={styles.statValue}>3,842</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Tokens Created</span>
                <span className={styles.statValue}>215</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick access section for mobile */}
        {screenSize === 'mobile' && (
          <div className={styles.quickAccessSection}>
            <h4>Quick Access</h4>
            <div className={styles.quickAccessButtons}>
              <button 
                className={styles.quickAccessButton}
                onClick={() => navigate('/rewards')}
              >
                <span className={styles.quickAccessIcon}>🏆</span>
                <span>Rewards</span>
              </button>
              <button 
                className={styles.quickAccessButton}
                onClick={() => navigate('/wallet')}
                disabled={!wallet.connected}
              >
                <span className={styles.quickAccessIcon}>💰</span>
                <span>Wallet</span>
              </button>
              <button 
                className={styles.quickAccessButton}
                onClick={() => navigate('/nft-assets')}
              >
                <span className={styles.quickAccessIcon}>🖼️</span>
                <span>NFTs</span>
              </button>
              <button 
                className={styles.quickAccessButton}
                onClick={() => navigate('/forum')}
              >
                <span className={styles.quickAccessIcon}>💬</span>
                <span>Forum</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 