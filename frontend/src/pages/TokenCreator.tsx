import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { TokenForm } from '@/components/features/tokens/TokenForm';
import { ConfirmationModal } from '@/components/features/tokens/ConfirmationModal';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import { createTokenMint, mintTokens } from '@/lib/solana/mint';
import { createAssociatedTokenAccount } from '@/lib/solana/account';
import styles from '@/styles/TokenCreator.module.css';
import { useNetwork } from '@/lib/solana/config';
import { NetworkSelector } from '@/components/features/network/NetworkSelector';
import { TokenConfig, defaultTokenConfig } from '@/types/token';
import { MINT_SIZE } from '@solana/spl-token';
import { useNavigate } from 'react-router-dom';
import { TokenSuccessModal } from '@/components/features/tokens/TokenSuccessModal';
import { createTokenMetadata } from '@/lib/solana/metadata';

export const TokenCreator = () => {
  const { network, setNetwork, connection } = useNetwork();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintAddress, setMintAddress] = useState('');
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>(defaultTokenConfig);
  const [currentStep, setCurrentStep] = useState<string>('');
  const navigate = useNavigate();

  const handleCreateToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Check SOL balance with more precise calculation
      const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      const ataRent = await connection.getMinimumBalanceForRentExemption(165); // ATA size
      const estimatedFees = 10000000; // 0.01 SOL for transaction fees
      const totalRequired = mintRent + ataRent + estimatedFees;
      
      const balance = await connection.getBalance(wallet.publicKey);
      console.log('Current balance:', balance / 1e9, 'SOL');
      console.log('Required balance:', totalRequired / 1e9, 'SOL');
      
      if (balance < totalRequired) {
        throw new Error(
          `Insufficient SOL on ${network}: Need at least ${totalRequired / 1e9} SOL, current balance: ${balance / 1e9} SOL`
        );
      }

      // 1. Create the token mint with simulation
      setCurrentStep('Creating token mint...');
      console.log('Creating token mint...');
      const { mintKeypair, mintAccount } = await createTokenMint(
        connection,
        wallet,
        tokenConfig
      );

      // Add metadata creation step
      setCurrentStep('Creating token metadata...');
      console.log('Creating token metadata...');
      try {
        await createTokenMetadata(
            connection,
            wallet,
            mintKeypair.publicKey,
            {
              name: tokenConfig.name,
              symbol: tokenConfig.symbol,
              description: tokenConfig.description, // optional
              image: tokenConfig.image,             // optional
              sellerFeeBasisPoints: 0
            }
          );
      } catch (error) {
        console.error('Metadata creation failed:', error);
        if (error instanceof Error && error.message?.includes('block height exceeded')) {
          setError('Transaction timeout - please try again. The network may be congested.');
        } else {
          setError(`Failed to create token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        throw error;
      }

      const mintAddressStr = mintKeypair.publicKey.toString();
      setMintAddress(mintAddressStr);
      console.log('Token mint created:', mintAddressStr);

      try {
        // 2. Create Associated Token Account (ATA) for the user
        setCurrentStep('Creating Associated Token Account...');
        console.log('Creating Associated Token Account...');
        const ata = await createAssociatedTokenAccount(
          connection,
          wallet,
          mintKeypair.publicKey
        );

        console.log('Associated Token Account created:', ata.toString());

        // 3. Mint initial supply to the user's ATA
        setCurrentStep('Minting initial supply...');
        console.log('Minting initial supply...');
        const initialSupply = BigInt(tokenConfig.totalSupply * Math.pow(10, tokenConfig.decimals));
        console.log('Initial supply (raw):', initialSupply.toString());
        
        await mintTokens(
          connection,
          wallet,
          mintKeypair,
          ata,
          initialSupply
        );

        console.log('Initial supply minted:', tokenConfig.totalSupply);

        // 4. Save token information to backend
        setCurrentStep('Saving token information...');
        console.log('Saving token information to backend...');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mint: mintAddressStr,
            name: tokenConfig.name,
            symbol: tokenConfig.symbol,
            decimals: tokenConfig.decimals,
            totalSupply: tokenConfig.totalSupply,
            owner: wallet.publicKey.toString(),
            features: tokenConfig.features
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save token information');
        }

        console.log('Token information saved to backend');
        
        // Show success modal instead of navigating
        setShowConfirmation(false);
        setShowSuccess(true);
      } catch (error) {
        console.error('Transaction failed:', error);
        // More specific error message based on the error type
        if (error instanceof Error) {
          if (error.message.includes('insufficient funds')) {
            setError('Insufficient SOL for transaction fees. Please add more SOL to your wallet.');
          } else if (error.message.includes('blockhash')) {
            setError('Transaction expired. Please try again.');
          } else {
            setError(`Transaction failed: ${error.message}`);
          }
        } else {
          setError('Transaction failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Token creation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to create token');
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  const handleViewExplorer = () => {
    const baseUrl = network === 'mainnet' 
      ? 'https://explorer.solana.com'
      : 'https://explorer.solana.com/?cluster=devnet';
    window.open(`${baseUrl}/address/${mintAddress}`, '_blank');
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setTokenConfig(defaultTokenConfig);
    setMintAddress('');
  };

  const handleViewDashboard = () => {
    navigate('/tokens');
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Token</h1>
          <NetworkSelector 
            currentNetwork={network}
            onNetworkChange={setNetwork}
          />
        </div>
        {!wallet.connected ? (
          <div className={styles.connectWalletContainer}>
            <p className={styles.subtitle}>Connect your wallet to start creating your token</p>
            <ConnectWallet />
          </div>
        ) : (
          <TokenForm 
            tokenConfig={tokenConfig}
            onChange={setTokenConfig}
            onSubmit={() => setShowConfirmation(true)}
            isWalletConnected={wallet.connected}
            error={error}
          />
        )}
        {showConfirmation && (
          <ConfirmationModal
            tokenConfig={tokenConfig}
            isLoading={isLoading}
            currentStep={currentStep}
            onConfirm={handleCreateToken}
            onCancel={() => setShowConfirmation(false)}
          />
        )}
        {showSuccess && (
          <TokenSuccessModal
            tokenConfig={tokenConfig}
            mintAddress={mintAddress}
            onViewExplorer={handleViewExplorer}
            onCreateAnother={handleCreateAnother}
            onViewDashboard={handleViewDashboard}
          />
        )}
      </div>
    </MainLayout>
  );
};