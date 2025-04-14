import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import styles from '@/styles/OnboardingFlow.module.css';
import { ConnectWallet } from '../wallet/ConnectWallet';
import { MainLayout } from '@/components/layout/MainLayout';

interface OnboardingFlowProps {
  initialStep?: number;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to New Earth',
    description: 'A decentralized platform for creators, developers, and visionaries building the future.',
    icon: '🌍'
  },
  {
    id: 'complete',
    title: 'Complete Your Onboarding',
    description: 'Connect your wallet to complete the onboarding process and start your journey.',
    icon: '🚀'
  },
  {
    id: 'success',
    title: 'Onboarding Complete',
    description: 'You\'re all set! Now you can explore the platform and start your first mission.',
    icon: '✅'
  }
];

export const OnboardingFlow = ({ initialStep = 0 }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const wallet = useWallet();

  const completeOnboarding = async () => {
    if (!wallet.publicKey) return;
    
    setIsProcessing(true);
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
          referralCode: '' // Adding empty referralCode since backend expects it
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Onboarding error response:', errorData);
        throw new Error(errorData.message || 'Failed to complete onboarding');
      }

      const data = await response.json();
      console.log('Onboarding success response:', data);
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // This is the "Complete Onboarding" step
      const success = await completeOnboarding();
      if (!success) {
        return;
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Redirect to dashboard (which is now the mission)
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  // Function to render wallet status
  const renderWalletStatus = () => {
    if (!wallet.connected) {
      return (
        <div className={styles.walletConnect}>
          <ConnectWallet />
        </div>
      );
    }
    
    return (
      <div className={styles.walletStatus}>
        <div className={styles.walletStatusIcon}>✅</div>
        <div className={styles.walletStatusInfo}>
          <div className={styles.walletStatusLabel}>Wallet Connected</div>
          <div className={styles.walletAddress}>
            {wallet.publicKey?.toString().slice(0, 6)}...{wallet.publicKey?.toString().slice(-4)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className={styles.onboardingContainer}>
        <div className={styles.onboardingHeader}>
          <h1>Welcome to New Earth</h1>
          <p>Complete these steps to get started on your journey</p>
        </div>
        
        <div className={styles.progressTracker}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`${styles.progressStep} ${
                index < currentStep ? styles.completed :
                index === currentStep ? styles.active : ''
              }`}
            >
              <div className={styles.stepNumber}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className={styles.stepLabel}>{step.title}</div>
            </div>
          ))}
        </div>
        
        <div className={styles.onboardingContent}>
          <div className={styles.currentStep}>
            <div className={styles.stepIcon}>{steps[currentStep].icon}</div>
            <h2>{steps[currentStep].title}</h2>
            <p>{steps[currentStep].description}</p>
            
            {currentStep === 1 && renderWalletStatus()}
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            <div className={styles.actionButtons}>
              {currentStep < steps.length - 1 && (
                <button 
                  className={styles.actionButton}
                  onClick={handleNext}
                  disabled={isProcessing || (currentStep === 1 && !wallet.connected)}
                >
                  {isProcessing ? 'Processing...' : 'Continue'}
                </button>
              )}
              
              {currentStep === steps.length - 1 && (
                <button 
                  className={styles.actionButton}
                  onClick={handleNext}
                >
                  Start Your Journey
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.onboardingNav}>
          <button 
            className={styles.skipButton}
            onClick={handleSkip}
          >
            Skip Onboarding
          </button>
        </div>
      </div>
    </MainLayout>
  );
}; 