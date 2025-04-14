import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '@/styles/MissionNavBar.module.css';

export const MissionProgressTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNavBar, setShowNavBar] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);

  useEffect(() => {
    const missionProgress = localStorage.getItem('firstStepsMissionProgress');
    if (missionProgress) {
      const progress = JSON.parse(missionProgress);
      const completedSteps = progress.completedSteps || [];
      let updated = false;
      
      // Check if we're on a mission-related page
      if (location.pathname === '/wallet' && 
          completedSteps.includes('wallet-intro-started') &&
          !completedSteps.includes('wallet-intro')) {
        // Mark wallet step as complete
        completedSteps.push('wallet-intro');
        setCurrentStepId('wallet-intro');
        updated = true;
        setShowNavBar(true);
      }
      
      if (location.pathname === '/nft-assets' && 
          completedSteps.includes('nft-gallery-started') &&
          !completedSteps.includes('nft-gallery')) {
        // Mark NFT gallery step as complete
        completedSteps.push('nft-gallery');
        setCurrentStepId('nft-gallery');
        updated = true;
        setShowNavBar(true);
      }
      
      if (location.pathname === '/jobs' && 
          completedSteps.includes('jobs-explore-started') &&
          !completedSteps.includes('jobs-explore')) {
        // Mark jobs step as complete
        completedSteps.push('jobs-explore');
        setCurrentStepId('jobs-explore');
        updated = true;
        setShowNavBar(true);
      }
      
      // Show the navigation bar on mission-related pages
      if (['/wallet', '/nft-assets', '/jobs'].includes(location.pathname)) {
        setShowNavBar(true);
      } else {
        setShowNavBar(false);
      }
      
      if (updated) {
        localStorage.setItem('firstStepsMissionProgress', JSON.stringify({
          completedSteps,
          currentStepId
        }));
      }
    }
  }, [location.pathname]);

  const handleReturnToMission = () => {
    // Use URL parameters for a more reliable approach
    if (currentStepId) {
      // Navigate to dashboard with the step ID directly in the URL
      navigate(`/dashboard?fromStep=${currentStepId}&timestamp=${Date.now()}`);
    } else {
      navigate('/dashboard');
    }
  };

  if (!showNavBar) return null;

  return (
    <div className={styles.missionNavBar}>
      <div className={styles.missionInfo}>
        <span className={styles.missionIcon}>🚀</span>
        <span className={styles.missionText}>First Steps Mission in Progress</span>
      </div>
      <button 
        className={styles.returnButton}
        onClick={handleReturnToMission}
      >
        Return to Mission
      </button>
    </div>
  );
}; 