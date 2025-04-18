import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import { NFTForm } from './NFTForm';
import { ConfirmationModal } from './ConfirmationModal';
import { SuccessModal } from './SuccessModal';
import styles from '@/styles/NFTLaunchStation.module.css';
import { useNetwork } from '@/lib/solana/config';
import { useNavigate } from 'react-router-dom';
import { NFTConfig, defaultNftConfig } from '@/types/nft';

export const NFTLaunchStation = () => {
  const { network, connection } = useNetwork();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintAddress, setMintAddress] = useState('');
  const [currentStep, setCurrentStep] = useState<string>('design');
  const [nftConfig, setNftConfig] = useState<NFTConfig>(defaultNftConfig);
  const navigate = useNavigate();

  const steps = [
    { id: 'design', label: 'Design NFT', icon: '📝' },
    { id: 'properties', label: 'Configure Properties', icon: '⚙️' },
    { id: 'preview', label: 'Preview Launch', icon: '👁️' },
    { id: 'confirm', label: 'Confirm Launch', icon: '✓' },
    { id: 'deploy', label: 'NFT Deployment', icon: '🚀' }
  ];

  const handleCreateNFT = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Check SOL balance
      const balance = await connection.getBalance(wallet.publicKey);
      const estimatedFees = 10000000; // 0.01 SOL for transaction fees
      
      if (balance < estimatedFees) {
        throw new Error(
          `Insufficient SOL on ${network}: Need at least ${estimatedFees / 1e9} SOL, current balance: ${balance / 1e9} SOL`
        );
      }

      // 1. Create NFT metadata and upload to Arweave
      setCurrentStep('Preparing NFT metadata...');
      console.log('Preparing NFT metadata...');
      
      // Create FormData for image upload
      const formData = new FormData();
      if (nftConfig.image) {
        formData.append('image', nftConfig.image);
      }
      
      // Add metadata
      formData.append('name', nftConfig.name);
      formData.append('description', nftConfig.description);
      formData.append('attributes', JSON.stringify(nftConfig.attributes));
      formData.append('royalties', nftConfig.royalties.toString());
      formData.append('supply', nftConfig.supply.toString());
      formData.append('network', network);
      
      // 2. Mint NFT
      setCurrentStep('Minting NFT...');
      console.log('Minting NFT...');
      
      // Mock mint address for now - in production this would come from your minting service
      const mintAddressStr = `NFT${Date.now().toString(36).toUpperCase()}`;
      setMintAddress(mintAddressStr);
      
      // 3. Save NFT information to backend
      setCurrentStep('Saving NFT information...');
      console.log('Saving NFT information to backend...');
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${wallet.publicKey.toString()}/nfts/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nftConfig.name,
          description: nftConfig.description,
          image_url: nftConfig.imageUrl || '/placeholder-nft.png',
          owner_wallet_id: wallet.publicKey.toString(),
          metadata: {
            name: nftConfig.name,
            description: nftConfig.description,
            imageUrl: nftConfig.imageUrl || '/placeholder-nft.png',
            attributes: nftConfig.attributes,
            royalties: nftConfig.royalties,
            supply: nftConfig.supply,
            collection: nftConfig.collection
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save NFT information');
      }

      console.log('NFT information saved to backend');
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error creating NFT:', error);
      setError(error instanceof Error ? error.message : 'Failed to create NFT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewExplorer = () => {
    const explorerUrl = network === 'mainnet' 
      ? `https://explorer.solana.com/address/${mintAddress}` 
      : `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`;
    window.open(explorerUrl, '_blank');
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setNftConfig(defaultNftConfig);
    setMintAddress('');
    setCurrentStep('design');
  };

  const handleViewGallery = () => {
    navigate('/nft-assets');
  };

  return (
    <MainLayout>
      <div className={styles.missionControlContainer}>
        <div className={styles.missionHeader}>
          <h1 className={styles.missionTitle}>
            <span className={styles.missionIcon}>🖼️</span> 
            NFT Launch Station
          </h1>
          <p className={styles.missionSubtitle}>
            Create and deploy your own NFTs on the Solana blockchain
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
          <div className={styles.missionStatus}>
            Status: <span className={isLoading ? styles.statusPending : styles.statusReady}>
              {isLoading ? 'Launch Sequence in Progress' : 'Ready for Deployment'}
            </span>
          </div>
        </div>
        
        <div className={styles.launchSequence}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`${styles.sequenceStep} ${
                currentStep === step.id ? styles.activeStep : ''
              }`}
            >
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepLabel}>{step.label}</div>
              {index < steps.length - 1 && <div className={styles.stepConnector} />}
            </div>
          ))}
        </div>
        
        <div className={styles.controlPanel}>
          {!wallet.connected ? (
            <div className={styles.connectWalletContainer}>
              <p className={styles.subtitle}>Connect your wallet to start creating your NFT</p>
              <ConnectWallet />
            </div>
          ) : (
            <NFTForm 
              nftConfig={nftConfig}
              onChange={setNftConfig}
              onSubmit={() => setShowConfirmation(true)}
              isWalletConnected={wallet.connected}
              error={error}
            />
          )}
        </div>
        
        {showConfirmation && (
          <ConfirmationModal
            nftConfig={nftConfig}
            isLoading={isLoading}
            currentStep={currentStep}
            onConfirm={handleCreateNFT}
            onCancel={() => setShowConfirmation(false)}
          />
        )}
        
        {showSuccess && (
          <SuccessModal
            nftConfig={nftConfig}
            mintAddress={mintAddress}
            onViewExplorer={handleViewExplorer}
            onCreateAnother={handleCreateAnother}
            onViewGallery={handleViewGallery}
          />
        )}
      </div>
    </MainLayout>
  );
}; 