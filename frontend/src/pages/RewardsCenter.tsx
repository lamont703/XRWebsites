import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { MainLayout } from '@/components/layout/MainLayout';
import styles from '@/styles/RewardsCenter.module.css';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import { useAuth } from '@/store/auth/Auth';

// Reward journey interface
interface RewardJourney {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  totalSteps: number;
  rewards: {
    tokens?: number;
    nfts?: {
      name: string;
      image: string;
    }[];
  };
  currentStep: {
    title: string;
    description: string;
  };
  isLocked?: boolean;
  featured?: boolean;
  path?: string; // Add path property for navigation
}

export const RewardsCenter = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [rewardJourneys, setRewardJourneys] = useState<RewardJourney[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<RewardJourney | null>(null);
  const [showJourneyDetails, setShowJourneyDetails] = useState(false);
  const [hasCompletedFirstSteps, setHasCompletedFirstSteps] = useState(false);

  useEffect(() => {
    loadRewardJourneys();
    
    // Check if user has completed first steps mission
    const checkFirstStepsMission = async () => {
      // In a real app, you would check from your backend
      // For now, we'll check localStorage
      const completed = localStorage.getItem('firstStepsMissionCompleted') === 'true';
      setHasCompletedFirstSteps(completed);
    };
    
    checkFirstStepsMission();
  }, [wallet.connected]);

  const loadRewardJourneys = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would fetch this from an API
      // For now, we'll use static data
      const journeys: RewardJourney[] = [
        {
          id: 'first-steps',
          title: 'First Steps Mission',
          description: 'Complete the onboarding mission to receive your "Key To The New Earth" NFT',
          icon: '🔑',
          progress: hasCompletedFirstSteps ? 4 : 0,
          totalSteps: 4,
          rewards: {
            nfts: [
              {
                name: 'Key To The New Earth',
                image: 'https://xrwebsitesarchive2024.blob.core.windows.net/uploads/ChatGPT%20Image%20Apr%2012,%202025,%2008_58_40%20PM.png'
              }
            ]
          },
          featured: true,
          path: '/onboarding/first-steps' // Path to the FirstStepsMission component
        },
        {
          id: 'community-builder',
          title: 'Community Builder',
          description: 'Contribute to the community and earn rewards',
          icon: '👥',
          progress: 2,
          totalSteps: 5,
          rewards: {
            tokens: 50,
            nfts: [
              {
                name: 'Community Builder Badge',
                image: '/images/nfts/community-badge.png'
              }
            ]
          },
          currentStep: {
            title: 'Participate in Forum Discussions',
            description: 'Create a post or reply to 3 existing threads in the community forum'
          }
        },
        {
          id: 'token-pioneer',
          title: 'Token Pioneer',
          description: 'Explore the tokenomics of our platform',
          icon: '🪙',
          progress: 1,
          totalSteps: 4,
          rewards: {
            tokens: 100,
            nfts: [
              {
                name: 'Token Pioneer Badge',
                image: '/images/nfts/token-badge.png'
              }
            ]
          },
          currentStep: {
            title: 'Join Token Pre-Sale',
            description: 'Participate in the token pre-sale to unlock the next steps'
          }
        },
        {
          id: 'creator-path',
          title: 'Creator Path',
          description: 'Create and launch your own digital assets',
          icon: '🎨',
          progress: 0,
          totalSteps: 6,
          rewards: {
            tokens: 200,
            nfts: [
              {
                name: 'Creator Genesis NFT',
                image: '/images/nfts/creator-nft.png'
              }
            ]
          },
          currentStep: {
            title: 'Start Your Creator Journey',
            description: 'Begin by creating your first token or NFT on our platform'
          },
          isLocked: !wallet.connected
        },
        {
          id: 'job-marketplace-explorer',
          title: 'Marketplace Explorer',
          description: 'Discover and engage with the job marketplace',
          icon: '💼',
          progress: 1,
          totalSteps: 3,
          rewards: {
            tokens: 75
          },
          currentStep: {
            title: 'Complete Your Profile',
            description: 'Add your skills and experience to your profile to unlock job opportunities'
          }
        },
        {
          id: 'orbital-staking',
          title: 'Orbital Staking Protocol',
          description: 'Deploy your tokens into orbit and earn rewards for supporting the ecosystem',
          icon: '🌌',
          progress: wallet.connected ? 1 : 0,
          totalSteps: 3,
          rewards: {
            tokens: 250,
            nfts: [
              {
                name: 'Orbital Engineer Badge',
                image: '/images/nfts/orbital-engineer.png'
              }
            ]
          },
          currentStep: {
            title: 'Deploy Your First Tokens',
            description: 'Stake tokens in an orbital pool to start earning rewards'
          },
          featured: true,
          path: '/staking'
        }
      ];
      
      setRewardJourneys(journeys);
    } catch (error) {
      console.error('Error loading reward journeys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJourneyClick = (journey: RewardJourney) => {
    if (journey.path) {
      navigate(journey.path);
    } else {
      setSelectedJourney(journey);
      setShowJourneyDetails(true);
    }
  };

  const handleBackToJourneys = () => {
    setShowJourneyDetails(false);
    setSelectedJourney(null);
  };

  const renderProgressBar = (progress: number, total: number) => {
    const percentage = (progress / total) * 100;
    
    return (
      <div className={styles.progressBarContainer}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${percentage}%` }}
        ></div>
        <span className={styles.progressText}>{progress} / {total}</span>
      </div>
    );
  };

  const renderJourneyDetails = () => {
    if (!selectedJourney) return null;
    
    return (
      <div className={styles.journeyDetailsContainer}>
        <button 
          className={styles.backButton}
          onClick={handleBackToJourneys}
        >
          ← Back to Journeys
        </button>
        
        <div className={styles.journeyHeader}>
          <div className={styles.journeyIcon}>{selectedJourney.icon}</div>
          <div>
            <h2>{selectedJourney.title}</h2>
            <p>{selectedJourney.description}</p>
          </div>
        </div>
        
        <div className={styles.journeyProgress}>
          <h3>Your Progress</h3>
          {renderProgressBar(selectedJourney.progress, selectedJourney.totalSteps)}
        </div>
        
        <div className={styles.currentStepCard}>
          <h3>Current Step</h3>
          <h4>{selectedJourney.currentStep.title}</h4>
          <p>{selectedJourney.currentStep.description}</p>
          <button className={styles.primaryButton}>
            Start This Step
          </button>
        </div>
        
        <div className={styles.rewardsSection}>
          <h3>Journey Rewards</h3>
          <div className={styles.rewardsGrid}>
            {selectedJourney.rewards.tokens && (
              <div className={styles.rewardCard}>
                <div className={styles.rewardIcon}>🪙</div>
                <h4>{selectedJourney.rewards.tokens} Tokens</h4>
                <p>Platform tokens to use across our ecosystem</p>
              </div>
            )}
            
            {selectedJourney.rewards.nfts?.map((nft, index) => (
              <div key={index} className={styles.rewardCard}>
                <div className={styles.rewardIcon}>🖼️</div>
                <h4>{nft.name}</h4>
                <p>Exclusive NFT reward for completing this journey</p>
                <div className={styles.nftPreview}>
                  <div className={styles.nftPlaceholder}>
                    NFT Preview
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.journeySteps}>
          <h3>Journey Path</h3>
          <div className={styles.stepsTimeline}>
            {Array.from({ length: selectedJourney.totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`${styles.timelineStep} ${
                  index < selectedJourney.progress ? styles.completedStep : 
                  index === selectedJourney.progress ? styles.currentStep : 
                  styles.futureStep
                }`}
              >
                <div className={styles.stepCircle}>{index + 1}</div>
                <div className={styles.stepContent}>
                  <h4>{index === selectedJourney.progress ? selectedJourney.currentStep.title : `Step ${index + 1}`}</h4>
                  {index === selectedJourney.progress && (
                    <p>{selectedJourney.currentStep.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className={styles.rewardsCenterContainer}>
        <div className={styles.rewardsCenterHeader}>
          <h1>Rewards Center</h1>
          <p>Complete missions and earn rewards for your contributions</p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        {!showJourneyDetails ? (
          <>
            {!wallet.connected && (
              <div className={styles.walletConnectBanner}>
                <div className={styles.bannerContent}>
                  <div className={styles.bannerIcon}>🔗</div>
                  <div className={styles.bannerText}>
                    <h3>Connect Your Wallet</h3>
                    <p>Connect your wallet to track progress and claim rewards</p>
                  </div>
                </div>
                <div className={styles.bannerAction}>
                  <ConnectWallet />
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading reward journeys...</p>
              </div>
            ) : (
              <div className={styles.journeysGrid}>
                {rewardJourneys.map(journey => (
                  <div 
                    key={journey.id}
                    className={`${styles.journeyCard} ${journey.featured ? styles.featuredJourney : ''} ${journey.isLocked ? styles.lockedJourney : ''}`}
                    onClick={() => handleJourneyClick(journey)}
                    role="button"
                    tabIndex={0}
                    aria-label={journey.title}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleJourneyClick(journey);
                      }
                    }}
                  >
                    {journey.featured && <div className={styles.featuredBadge}>Featured</div>}
                    <div className={styles.journeyCardHeader}>
                      <div className={styles.journeyIcon}>{journey.icon}</div>
                      <h3>{journey.title}</h3>
                    </div>
                    <p className={styles.journeyDescription}>{journey.description}</p>
                    
                    <div className={styles.journeyCardFooter}>
                      {renderProgressBar(journey.progress, journey.totalSteps)}
                      
                      <div className={styles.journeyRewards}>
                        {journey.rewards.tokens && (
                          <span className={styles.tokenReward}>🪙 {journey.rewards.tokens}</span>
                        )}
                        {journey.rewards.nfts && (
                          <span className={styles.nftReward}>🖼️ {journey.rewards.nfts.length}</span>
                        )}
                      </div>
                      
                      {journey.isLocked ? (
                        <div className={styles.lockedOverlay}>
                          <span className={styles.lockedText}>Connect Wallet</span>
                        </div>
                      ) : (
                        <span className={styles.journeyArrow}>→</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          renderJourneyDetails()
        )}
      </div>
    </MainLayout>
  );
}; 