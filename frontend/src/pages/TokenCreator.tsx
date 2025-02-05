import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import styles from '../styles/Dashboard.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';

interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  initialOwner: string;
  tokenType: 'fungible' | 'non-fungible';
  features: {
    freezable: boolean;
    mintable: boolean;
    immutable: boolean;
    burnable: boolean;
  };
  metadata: {
    description: string;
    website?: string;
    image?: string;
  };
  distribution: {
    initialPrice: number;
    presaleAllocation: number;
    publicAllocation: number;
    teamAllocation: number;
  };
  economics: {
    maxSupply: number;
    inflationRate: number;
    transactionFee: number;
  };
}

export const TokenCreator = () => {
  const { user } = useAuth();
  const wallet = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: '',
    symbol: '',
    decimals: 9,
    totalSupply: 1000000,
    initialOwner: '',
    tokenType: 'fungible',
    features: {
      freezable: false,
      mintable: true,
      immutable: false,
      burnable: true
    },
    metadata: {
      description: '',
      website: '',
      image: ''
    },
    distribution: {
      initialPrice: 0.01,
      presaleAllocation: 20,
      publicAllocation: 60,
      teamAllocation: 20
    },
    economics: {
      maxSupply: 1000000000,
      inflationRate: 0,
      transactionFee: 0
    }
  });

  const handleCreateToken = async () => {
    if (!wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tokens/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...tokenConfig,
          walletAddress: wallet.publicKey?.toString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create token');
      }

      const data = await response.json();
      setCurrentStep(3); // Move to confirmation step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async (address: string) => {
    try {
      setTokenConfig(prev => ({
        ...prev,
        initialOwner: address
      }));
    } catch (error) {
      setError('Failed to connect wallet');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Token Creator</h1>
          <p className="text-gray-400 text-sm sm:text-base">Create your own Solana token in minutes</p>
        </div>

        {/* Wallet Connection Section */}
        <div className="mb-6 sm:mb-8">
          <ConnectWallet onConnect={handleWalletConnect} />
        </div>

        {/* Token Configuration Form */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Token Configuration</h2>
          
          <form className="space-y-6 sm:space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Token Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">
                    Token Name
                  </label>
                  <input
                    type="text"
                    value={tokenConfig.name}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-700 border border-gray-600 text-white 
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder="My Custom Token"
                  />
                </div>

                {/* Token Symbol Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">
                    Token Symbol
                  </label>
                  <input
                    type="text"
                    value={tokenConfig.symbol}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, symbol: e.target.value }))}
                    className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-700 border border-gray-600 text-white 
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder="MCT"
                  />
                </div>
              </div>
            </div>

            {/* Token Features Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Token Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Token Type
                  </label>
                  <select
                    value={tokenConfig.tokenType}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      tokenType: e.target.value as 'fungible' | 'non-fungible'
                    }))}
                    className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white 
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="fungible">Fungible Token</option>
                    <option value="non-fungible">Non-Fungible Token (NFT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="freezable"
                    checked={tokenConfig.features.freezable}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      features: { ...prev.features, freezable: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="freezable" className="text-sm text-gray-400">
                    Freezable
                  </label>
                </div>
                {/* Add other feature toggles similarly */}
              </div>
            </div>

            {/* Token Economics Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Token Economics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Initial Price (USD)
                  </label>
                  <input
                    type="number"
                    value={tokenConfig.distribution.initialPrice}
                    onChange={(e) => setTokenConfig(prev => ({
                      ...prev,
                      distribution: { 
                        ...prev.distribution, 
                        initialPrice: parseFloat(e.target.value) 
                      }
                    }))}
                    className="w-full p-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white 
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    step="0.000001"
                    min="0"
                  />
                </div>
                {/* Add other economic inputs similarly */}
              </div>
            </div>

            {/* Token Distribution Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Token Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Add distribution percentage inputs */}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreateToken}
              disabled={!wallet.connected || isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 
                font-medium transition-colors text-sm sm:text-base mt-4 sm:mt-6
                ${(!wallet.connected || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Creating Token...' : 'Create Token'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}; 