import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import styles from '@/styles/FirstStepsMission.module.css';
import { useAuth } from '@/store/auth/Auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConnectWallet } from '../wallet/ConnectWallet';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const missionSteps = [
  {
    id: 'wallet-intro',
    title: 'Explore Your Wallet',
    description: 'Learn how to view your balance and manage your digital assets.',
    icon: '💰',
    action: 'View Wallet',
    path: '/wallet',
    completionCriteria: 'visit-wallet',
    details: 'Your wallet is your gateway to the blockchain. Here you can view your balance, send and receive tokens, and manage your digital assets.'
  },
  {
    id: 'nft-gallery',
    title: 'Discover NFTs',
    description: 'See how NFTs work and how they represent digital ownership.',
    icon: '🖼️',
    action: 'View NFT Gallery',
    path: '/nft-assets',
    completionCriteria: 'visit-nft-gallery',
    details: 'NFTs (Non-Fungible Tokens) represent unique digital items. In your gallery, you can view your NFTs, including your "Key To The New Earth" which grants you access to exclusive features.'
  },
  {
    id: 'jobs-explore',
    title: 'Explore Opportunities',
    description: 'Discover jobs and bounties available on the platform.',
    icon: '💼',
    action: 'Browse Jobs',
    path: '/jobs',
    completionCriteria: 'visit-jobs',
    details: 'The jobs marketplace connects developers with clients. Browse available opportunities or post your own projects to find collaborators.'
  },
  {
    id: 'claim-reward',
    title: 'Claim Your First Reward',
    description: 'Complete this mission to receive your "Key To The New Earth" NFT.',
    icon: '🔑',
    action: 'Claim Reward',
    completionCriteria: 'mint-nft',
    details: 'The "Key To The New Earth" NFT is your spiritual and technological passport, unlocking tools, spaces, and opportunities within our ecosystem. This soulbound NFT marks you as a visionary and builder in our community.'
  }
];

export const FirstStepsMission = () => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showMissionIntro, setShowMissionIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [mockJobs, setMockJobs] = useState([]);
  const navigate = useNavigate();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Load saved progress
    const savedProgress = localStorage.getItem('firstStepsMissionProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCompletedSteps(progress.completedSteps || []);
      
      // First check URL parameters (highest priority)
      const params = new URLSearchParams(location.search);
      const fromStep = params.get('fromStep');
      
      if (fromStep) {
        console.log("URL parameter found, returning from step:", fromStep);
        
        // Find the index of the completed step
        const stepIndex = missionSteps.findIndex(step => step.id === fromStep);
        console.log("Step index from URL:", stepIndex);
        
        if (stepIndex >= 0 && stepIndex < missionSteps.length - 1) {
          console.log("Setting current step from URL to:", stepIndex + 1);
          // Force immediate state update
          setCurrentStepIndex(stepIndex + 1);
        }
        
        // Clear the URL parameter by replacing the current history entry
        navigate('/dashboard', { replace: true });
      } else {
        // Normal flow - find the first incomplete step
        const nextIncompleteIndex = missionSteps.findIndex(
          step => !progress.completedSteps.includes(step.id)
        );
        setCurrentStepIndex(nextIncompleteIndex >= 0 ? nextIncompleteIndex : 0);
      }
    }

    // Set up mock jobs data
    setMockJobs([
      {
        id: 'job-1',
        title: 'Build a DeFi Dashboard',
        description: 'Looking for a developer to create a dashboard for tracking DeFi investments',
        budget: '2,000 USDC',
        skills: ['React', 'Web3', 'Solana'],
        postedBy: 'CryptoVentures'
      },
      {
        id: 'job-2',
        title: 'NFT Collection Smart Contract',
        description: 'Need a smart contract developer to create an NFT collection with royalties',
        budget: '3,500 USDC',
        skills: ['Rust', 'Solana', 'NFTs'],
        postedBy: 'ArtistCollective'
      },
      {
        id: 'job-3',
        title: 'Mobile Wallet Integration',
        description: 'Integrate Solana wallet functionality into our existing mobile app',
        budget: '4,000 USDC',
        skills: ['React Native', 'Mobile', 'Solana'],
        postedBy: 'MobileFintech'
      }
    ]);

    // Handle returning from a specific page
    const queryParams = new URLSearchParams(location.search);
    const returnFrom = queryParams.get('returnFrom');
    
    if (returnFrom) {
      // Map the return path to the corresponding step
      const stepMap = {
        'wallet': 'wallet-intro',
        'nft-assets': 'nft-gallery',
        'jobs': 'jobs-explore'
      };
      
      const stepId = stepMap[returnFrom as keyof typeof stepMap];
      
      if (stepId) {
        // Find the next step after the completed one
        const stepIndex = missionSteps.findIndex(step => step.id === stepId);
        if (stepIndex >= 0 && stepIndex < missionSteps.length - 1) {
          setCurrentStepIndex(stepIndex + 1);
        }
      }
    }
  }, [location.search, navigate]);

  // Add a useEffect to log when currentStepIndex changes
  useEffect(() => {
    console.log("Current step index updated to:", currentStepIndex);
    console.log("Current step is now:", missionSteps[currentStepIndex]?.title);
  }, [currentStepIndex]);

  // Fetch wallet balance when needed
  const fetchBalance = async () => {
    if (!wallet.publicKey || !connection) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const saveProgress = (updatedSteps: string[]) => {
    localStorage.setItem('firstStepsMissionProgress', JSON.stringify({
      completedSteps: updatedSteps
    }));
  };

  const handleStepAction = async (step: typeof missionSteps[0]) => {
    if (step.completionCriteria === 'mint-nft') {
      await mintOnboardingNFT();
    } else {
      // Show preview content directly in the mission flow
      if (step.id === 'wallet-intro') {
        setCurrentPreview('wallet-preview');
        fetchBalance();
      } else if (step.id === 'nft-gallery') {
        setCurrentPreview('nft-preview');
      } else if (step.id === 'jobs-explore') {
        setCurrentPreview('jobs-preview');
      }
      
      // Mark as in-progress
      const inProgress = [...completedSteps, `${step.id}-started`];
      setCompletedSteps(inProgress);
      saveProgress(inProgress);
    }
  };

  const completeStep = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const updated = [...completedSteps, stepId];
      setCompletedSteps(updated);
      saveProgress(updated);
      
      // Move to next step if available
      if (currentStepIndex < missionSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const mintOnboardingNFT = async () => {
    if (!wallet.publicKey) return;
    
    setIsMinting(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toString(),
          referralCode: '' // Add referral code if available
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mint NFT');
      }

      // Mark final step as complete
      completeStep('claim-reward');
      setIsComplete(true);
      
      // Clear mission progress from localStorage
      localStorage.removeItem('firstStepsMissionProgress');
      
    } catch (err) {
      console.error('Error minting NFT:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const handleStartMission = () => {
    setShowMissionIntro(false);
  };

  const handleSkipMission = () => {
    // Navigate to classic dashboard
    navigate('/classic-dashboard');
  };

  // Check if a step is completed
  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  // Check if a step is in progress
  const isStepInProgress = (stepId: string) => {
    return completedSteps.includes(`${stepId}-started`);
  };

  // Close the current preview and mark step as complete
  const handleClosePreview = (stepId: string) => {
    setCurrentPreview(null);
    completeStep(stepId);
  };

  // View full page
  const handleViewFullPage = (path: string) => {
    navigate(path);
  };

  // Render wallet preview
  const renderWalletPreview = () => {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <h3>Your Wallet</h3>
          <button 
            className={styles.closePreviewButton}
            onClick={() => handleClosePreview('wallet-intro')}
          >
            ✕
          </button>
        </div>
        
        <div className={styles.walletPreview}>
          <div className={styles.walletAddress}>
            <span className={styles.previewLabel}>Your Address:</span>
            <div className={styles.addressBox}>
              <span className={styles.addressText}>
                {wallet.publicKey?.toString().slice(0, 10)}...{wallet.publicKey?.toString().slice(-8)}
              </span>
              <button className={styles.copyButton}>Copy</button>
            </div>
          </div>
          
          <div className={styles.walletBalance}>
            <span className={styles.previewLabel}>SOL Balance:</span>
            <div className={styles.balanceValue}>
              {isLoadingBalance ? (
                <span className={styles.loadingBalance}>Loading...</span>
              ) : (
                <span>{balance !== null ? `${balance.toFixed(4)} SOL` : 'Error loading balance'}</span>
              )}
            </div>
          </div>
          
          <div className={styles.walletActions}>
            <div className={styles.actionButton}>Send</div>
            <div className={styles.actionButton}>Receive</div>
            <div className={styles.actionButton}>Swap</div>
          </div>
        </div>
        
        <div className={styles.previewFooter}>
          <button 
            className={styles.primaryButton}
            onClick={() => handleClosePreview('wallet-intro')}
          >
            Continue Mission
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => handleViewFullPage('/wallet')}
          >
            View Full Wallet
          </button>
        </div>
      </div>
    );
  };

  // Render NFT gallery preview
  const renderNFTPreview = () => {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <h3>Your NFT Gallery</h3>
          <button 
            className={styles.closePreviewButton}
            onClick={() => handleClosePreview('nft-gallery')}
          >
            ✕
          </button>
        </div>
        
        <div className={styles.nftPreviewGallery}>
          <div className={styles.emptyNftState}>
            <div className={styles.emptyNftIcon}>🖼️</div>
            <p>Complete this mission to receive your first NFT!</p>
            <div className={styles.comingSoonNft}>
              <img 
                src="https://xrwebsitesarchive2024.blob.core.windows.net/uploads/ChatGPT%20Image%20Apr%2012,%202025,%2008_58_40%20PM.png" 
                alt="Key To The New Earth NFT" 
                className={styles.comingSoonNftImage}
              />
              <div className={styles.comingSoonLabel}>Coming Soon</div>
            </div>
          </div>
        </div>
        
        <div className={styles.previewFooter}>
          <button 
            className={styles.primaryButton}
            onClick={() => handleClosePreview('nft-gallery')}
          >
            Continue Mission
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => handleViewFullPage('/nft-assets')}
          >
            View Full Gallery
          </button>
        </div>
      </div>
    );
  };

  // Render jobs preview
  const renderJobsPreview = () => {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <h3>Available Opportunities</h3>
          <button 
            className={styles.closePreviewButton}
            onClick={() => handleClosePreview('jobs-explore')}
          >
            ✕
          </button>
        </div>
        
        <div className={styles.jobsPreview}>
          {mockJobs.map((job: any) => (
            <div key={job.id} className={styles.jobCard}>
              <h4>{job.title}</h4>
              <p className={styles.jobDescription}>{job.description}</p>
              <div className={styles.jobMeta}>
                <span className={styles.jobBudget}>{job.budget}</span>
                <span className={styles.jobPostedBy}>by {job.postedBy}</span>
              </div>
              <div className={styles.jobSkills}>
                {job.skills.map((skill: string) => (
                  <span key={skill} className={styles.skillTag}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.previewFooter}>
          <button 
            className={styles.primaryButton}
            onClick={() => handleClosePreview('jobs-explore')}
          >
            Continue Mission
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => handleViewFullPage('/jobs')}
          >
            View All Jobs
          </button>
        </div>
      </div>
    );
  };

  // Render the appropriate preview based on currentPreview state
  const renderPreview = () => {
    switch(currentPreview) {
      case 'wallet-preview':
        return renderWalletPreview();
      case 'nft-preview':
        return renderNFTPreview();
      case 'jobs-preview':
        return renderJobsPreview();
      default:
        return null;
    }
  };

  // Render mission intro screen
  const renderMissionIntro = () => {
    return (
      <div className={styles.missionIntro}>
        <div className={styles.introIcon}>🚀</div>
        <h1>Welcome to New Earth</h1>
        <p>
          Complete this First Steps Mission to receive your "Key To The New Earth" NFT
          and unlock the full potential of the platform.
        </p>
        
        <div className={styles.missionPreview}>
          {missionSteps.map((step, index) => (
            <div key={step.id} className={styles.previewStep}>
              <div className={styles.previewIcon}>{step.icon}</div>
              <div className={styles.previewTitle}>{step.title}</div>
            </div>
          ))}
        </div>
        
        <div className={styles.introActions}>
          <button 
            className={styles.primaryButton}
            onClick={handleStartMission}
          >
            Begin Mission
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={handleSkipMission}
          >
            Skip for Now
          </button>
        </div>
      </div>
    );
  };

  // Render mission completion screen
  const renderMissionComplete = () => {
    return (
      <div className={styles.missionComplete}>
        <div className={styles.successIcon}>🎉</div>
        <h2>Mission Complete!</h2>
        <p>You've received your "Key To The New Earth" NFT</p>
        <p>This NFT represents your membership in our community and grants you access to exclusive features.</p>
        
        <div className={styles.nftPreview}>
          <img 
            src="https://xrwebsitesarchive2024.blob.core.windows.net/uploads/ChatGPT%20Image%20Apr%2012,%202025,%2008_58_40%20PM.png" 
            alt="Key To The New Earth NFT" 
            className={styles.nftImage}
          />
          <div className={styles.nftDetails}>
            <h3>Key To The New Earth</h3>
            <p>This digital key represents more than access—it marks your entrance into a new realm of co-creation.</p>
          </div>
        </div>
        
        <button 
          className={styles.primaryButton}
          onClick={handleSkipMission}
        >
          Go to Dashboard
        </button>
      </div>
    );
  };

  // Main render function
  return (
    <MainLayout>
      <div className={styles.missionContainer}>
        {showMissionIntro ? (
          renderMissionIntro()
        ) : isComplete ? (
          renderMissionComplete()
        ) : currentPreview ? (
          renderPreview()
        ) : (
          <>
            <div className={styles.missionHeader}>
              <h1>First Steps Mission</h1>
              <p>Complete these steps to receive your "Key To The New Earth" NFT</p>
            </div>

            <div className={styles.progressTracker}>
              {missionSteps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`${styles.progressStep} ${
                    isStepCompleted(step.id) ? styles.completed :
                    index === currentStepIndex ? styles.active : ''
                  }`}
                >
                  <div className={styles.stepNumber}>
                    {isStepCompleted(step.id) ? '✓' : index + 1}
                  </div>
                  <div className={styles.stepLabel}>{step.title}</div>
                </div>
              ))}
            </div>

            <div className={styles.missionContent}>
              {!wallet.connected ? (
                <div className={styles.walletConnect}>
                  <div className={styles.stepIcon}>🔗</div>
                  <h2>Connect Your Wallet</h2>
                  <p>You need to connect your wallet to start the mission</p>
                  <ConnectWallet />
                </div>
              ) : (
                <div className={styles.currentStep}>
                  <div className={styles.stepIcon}>{missionSteps[currentStepIndex].icon}</div>
                  <h2>{missionSteps[currentStepIndex].title}</h2>
                  <p>{missionSteps[currentStepIndex].description}</p>
                  
                  <div className={styles.stepDetails}>
                    {missionSteps[currentStepIndex].details}
                  </div>
                  
                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}
                  
                  <button 
                    className={styles.actionButton}
                    onClick={() => handleStepAction(missionSteps[currentStepIndex])}
                    disabled={isMinting}
                  >
                    {isMinting ? 'Processing...' : missionSteps[currentStepIndex].action}
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.missionNav}>
              <button 
                className={styles.skipButton}
                onClick={handleSkipMission}
              >
                Skip Mission
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}; 