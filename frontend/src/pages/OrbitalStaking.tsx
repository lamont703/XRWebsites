import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import styles from '@/styles/OrbitalStaking.module.css';

// Orbital staking option interface
interface OrbitalOption {
  id: string;
  name: string;
  description: string;
  apy: string;
  icon: string;
  minPeriod: number;
  maxPeriod: number;
  color: string;
  special?: boolean;
}

// Active staking position interface
interface StakingPosition {
  id: string;
  orbitId: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  estimatedRewards: number;
  apy: number;
}

export const OrbitalStaking = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [selectedOrbit, setSelectedOrbit] = useState<string | null>(null);
  const [stakingAmount, setStakingAmount] = useState('');
  const [stakingPeriod, setStakingPeriod] = useState(30); // days
  const [isDeploying, setIsDeploying] = useState(false);
  const [activePositions, setActivePositions] = useState<StakingPosition[]>([]);
  const [userBalance, setUserBalance] = useState(1000); // Mock balance
  const [estimatedApy, setEstimatedApy] = useState(0);
  const [estimatedRewards, setEstimatedRewards] = useState(0);
  
  // Orbital staking options
  const orbitalOptions: OrbitalOption[] = [
    {
      id: 'low-orbit',
      name: 'Low Orbit',
      description: 'Quick deployment, lower yield, 7-30 day missions',
      apy: '8-12%',
      icon: '🛰️',
      minPeriod: 7,
      maxPeriod: 30,
      color: '#4dabf7'
    },
    {
      id: 'medium-orbit',
      name: 'Medium Orbit',
      description: 'Balanced deployment, moderate yield, 30-90 day missions',
      apy: '12-18%',
      icon: '🚀',
      minPeriod: 30,
      maxPeriod: 90,
      color: '#9775fa'
    },
    {
      id: 'high-orbit',
      name: 'High Orbit',
      description: 'Extended deployment, higher yield, 90-365 day missions',
      apy: '18-25%',
      icon: '✨',
      minPeriod: 90,
      maxPeriod: 365,
      color: '#f783ac'
    },
    {
      id: 'deep-space',
      name: 'Deep Space Mission',
      description: 'Special ecosystem development pools with variable rewards',
      apy: 'Variable',
      icon: '🌌',
      minPeriod: 180,
      maxPeriod: 365,
      color: '#cc5de8',
      special: true
    }
  ];

  useEffect(() => {
    // Load active staking positions
    if (wallet.connected) {
      loadActivePositions();
    }
  }, [wallet.connected]);

  useEffect(() => {
    // Calculate estimated rewards when inputs change
    if (selectedOrbit && stakingAmount) {
      calculateRewards();
    }
  }, [selectedOrbit, stakingAmount, stakingPeriod]);

  const loadActivePositions = async () => {
    // In a real implementation, you would fetch this from the blockchain
    // For now, we'll use mock data
    const mockPositions: StakingPosition[] = [
      {
        id: '1',
        orbitId: 'medium-orbit',
        amount: 500,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        estimatedRewards: 22.5,
        apy: 15
      }
    ];
    
    setActivePositions(mockPositions);
  };

  const calculateRewards = () => {
    if (!selectedOrbit || !stakingAmount) return;
    
    const orbit = orbitalOptions.find(o => o.id === selectedOrbit);
    if (!orbit) return;
    
    // Parse APY range and get average
    const apyRange = orbit.apy.replace('%', '').split('-');
    let apy = 0;
    
    if (apyRange.length === 2) {
      // Calculate APY based on staking period - longer periods get higher APY
      const minApy = parseFloat(apyRange[0]);
      const maxApy = parseFloat(apyRange[1]);
      const periodRange = orbit.maxPeriod - orbit.minPeriod;
      const periodRatio = (stakingPeriod - orbit.minPeriod) / periodRange;
      apy = minApy + (maxApy - minApy) * periodRatio;
    } else {
      apy = parseFloat(apyRange[0]);
    }
    
    // Calculate estimated rewards
    const amount = parseFloat(stakingAmount);
    const rewards = amount * (apy / 100) * (stakingPeriod / 365);
    
    setEstimatedApy(apy);
    setEstimatedRewards(rewards);
  };

  const handleDeployTokens = async () => {
    if (!selectedOrbit || !stakingAmount || isDeploying) return;
    
    try {
      setIsDeploying(true);
      
      // In a real implementation, you would call a smart contract here
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new staking position
      const amount = parseFloat(stakingAmount);
      const newPosition: StakingPosition = {
        id: Date.now().toString(),
        orbitId: selectedOrbit,
        amount,
        startDate: new Date(),
        endDate: new Date(Date.now() + stakingPeriod * 24 * 60 * 60 * 1000),
        estimatedRewards,
        apy: estimatedApy
      };
      
      setActivePositions([...activePositions, newPosition]);
      setStakingAmount('');
      setSelectedOrbit(null);
      
      // Update user balance
      setUserBalance(userBalance - amount);
      
    } catch (error) {
      console.error('Error deploying tokens:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const renderActivePosition = (position: StakingPosition) => {
    const orbit = orbitalOptions.find(o => o.id === position.orbitId);
    const daysRemaining = Math.ceil((position.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const progressPercentage = 100 - (daysRemaining / ((position.endDate.getTime() - position.startDate.getTime()) / (24 * 60 * 60 * 1000)) * 100);
    
    return (
      <div key={position.id} className={styles.activePosition}>
        <div className={styles.positionHeader}>
          <div className={styles.positionIcon} style={{ color: orbit?.color }}>{orbit?.icon}</div>
          <div className={styles.positionDetails}>
            <h3>{orbit?.name} Deployment</h3>
            <p>{position.amount.toLocaleString()} Tokens</p>
          </div>
        </div>
        
        <div className={styles.positionProgress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: orbit?.color 
              }}
            />
          </div>
          <div className={styles.progressDetails}>
            <span>{daysRemaining} days remaining</span>
            <span>{position.apy.toFixed(1)}% APY</span>
          </div>
        </div>
        
        <div className={styles.positionRewards}>
          <div className={styles.rewardMetric}>
            <span className={styles.metricLabel}>Estimated Rewards:</span>
            <span className={styles.metricValue}>+{position.estimatedRewards.toFixed(2)} Tokens</span>
          </div>
          <div className={styles.rewardMetric}>
            <span className={styles.metricLabel}>Maturity Date:</span>
            <span className={styles.metricValue}>{position.endDate.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className={styles.stakingContainer}>
        <div className={styles.stakingHeader}>
          <h1 className={styles.stakingTitle}>
            <span className={styles.stakingIcon}>🌌</span> 
            Orbital Staking Protocol
          </h1>
          <p className={styles.stakingSubtitle}>
            Deploy your tokens into orbit and earn rewards for supporting the ecosystem
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        {!wallet.connected ? (
          <div className={styles.walletConnectBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>🔗</div>
              <div className={styles.bannerText}>
                <h3>Connect Your Wallet</h3>
                <p>Connect your wallet to deploy tokens into orbit</p>
              </div>
            </div>
            <div className={styles.bannerAction}>
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <>
            <div className={styles.orbitalMap}>
              <div className={styles.coreSystem}>
                <div className={styles.ecosystemCore}></div>
                {orbitalOptions.map((orbit, index) => (
                  <div 
                    key={orbit.id}
                    className={`${styles.orbitalRing} ${selectedOrbit === orbit.id ? styles.selectedOrbit : ''}`}
                    style={{ 
                      width: `${(index + 2) * 100}px`, 
                      height: `${(index + 2) * 100}px`,
                      borderColor: orbit.color 
                    }}
                    onClick={() => setSelectedOrbit(orbit.id)}
                  >
                    <div 
                      className={styles.orbitalIcon} 
                      style={{ 
                        color: orbit.color,
                        transform: `translate(${Math.cos(index * 0.5) * 50}px, ${Math.sin(index * 0.5) * 50}px)`
                      }}
                    >
                      {orbit.icon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.stakingControls}>
              <div className={styles.stakingInfo}>
                <h2>Mission Parameters</h2>
                <div className={styles.stakingParameters}>
                  <div className={styles.parameterGroup}>
                    <label>Select Orbital Deployment</label>
                    <div className={styles.orbitalOptions}>
                      {orbitalOptions.map(orbit => (
                        <div 
                          key={orbit.id}
                          className={`${styles.orbitalOption} ${selectedOrbit === orbit.id ? styles.selectedOption : ''}`}
                          onClick={() => setSelectedOrbit(orbit.id)}
                        >
                          <div className={styles.orbitalOptionIcon} style={{ color: orbit.color }}>{orbit.icon}</div>
                          <div className={styles.orbitalOptionDetails}>
                            <h3>{orbit.name}</h3>
                            <p>{orbit.description}</p>
                            <div className={styles.orbitalOptionApy}>APY: {orbit.apy}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.parameterGroup}>
                    <label>Deployment Amount</label>
                    <div className={styles.inputWithBalance}>
                      <input 
                        type="text" 
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="Enter amount to stake"
                        className={styles.stakingInput}
                      />
                      <div className={styles.balanceInfo}>
                        Balance: {userBalance.toLocaleString()} Tokens
                        <button 
                          className={styles.maxButton}
                          onClick={() => setStakingAmount(userBalance.toString())}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedOrbit && (
                    <div className={styles.parameterGroup}>
                      <label>Mission Duration: {stakingPeriod} days</label>
                      <input 
                        type="range"
                        min={selectedOrbit ? orbitalOptions.find(o => o.id === selectedOrbit)?.minPeriod : 7}
                        max={selectedOrbit ? orbitalOptions.find(o => o.id === selectedOrbit)?.maxPeriod : 365}
                        value={stakingPeriod}
                        onChange={(e) => setStakingPeriod(parseInt(e.target.value))}
                        className={styles.durationSlider}
                        style={{
                          background: orbitalOptions.find(o => o.id === selectedOrbit)?.color
                        }}
                      />
                      <div className={styles.durationMarkers}>
                        <span>{orbitalOptions.find(o => o.id === selectedOrbit)?.minPeriod} days</span>
                        <span>{orbitalOptions.find(o => o.id === selectedOrbit)?.maxPeriod} days</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedOrbit && stakingAmount && (
                  <div className={styles.rewardsPreview}>
                    <h3>Projected Rewards</h3>
                    <div className={styles.rewardsCalculation}>
                      <div className={styles.rewardMetric}>
                        <span className={styles.metricLabel}>Estimated APY:</span>
                        <span className={styles.metricValue}>{estimatedApy.toFixed(1)}%</span>
                      </div>
                      <div className={styles.rewardMetric}>
                        <span className={styles.metricLabel}>Projected Earnings:</span>
                        <span className={styles.metricValue}>+{estimatedRewards.toFixed(2)} Tokens</span>
                      </div>
                      <div className={styles.rewardMetric}>
                        <span className={styles.metricLabel}>Unbonding Period:</span>
                        <span className={styles.metricValue}>
                          {selectedOrbit === 'low-orbit' ? '3' : 
                           selectedOrbit === 'medium-orbit' ? '7' : 
                           selectedOrbit === 'high-orbit' ? '14' : '21'} days
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  className={styles.deployButton}
                  disabled={!selectedOrbit || !stakingAmount || isDeploying || parseFloat(stakingAmount) > userBalance}
                  onClick={handleDeployTokens}
                >
                  {isDeploying ? 'Deploying to Orbit...' : 'Deploy Tokens to Orbit'}
                </button>
              </div>
              
              <div className={styles.activeStakingMissions}>
                <h2>Active Orbital Deployments</h2>
                {activePositions.length > 0 ? (
                  <div className={styles.positionsGrid}>
                    {activePositions.map(renderActivePosition)}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>🚀</div>
                    <p>No active deployments. Launch your first orbital mission!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}; 