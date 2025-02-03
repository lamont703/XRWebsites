import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '../store/auth/AuthContext';
import styles from '../styles/Dashboard.module.css';
import { useLocation } from 'react-router-dom';
import { NFTGallery } from '@/components/features/wallet/NFTGallery';
import { FeaturedNFT } from '@/components/features/assets/FeaturedNFT';
import type { NFT } from '@/types/nft';

export const Assets = () => {
  const { user } = useAuth();
  const { state } = useLocation();
  const [selectedNft, setSelectedNft] = useState<NFT | null>(state?.selectedNft || null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState({ id: '' });

  const loadWalletData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load wallet data');
      }

      const { data } = await response.json();
      setWalletData({ id: data.id });
      return data.id;
    } catch (err) {
      console.error('Error loading wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    }
  };

  const loadNFTs = async () => {
    try {
      const walletId = await loadWalletData();
      if (!walletId) {
        throw new Error('No wallet ID available');
      }

      console.log('Wallet ID:', walletId);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletId}/nfts`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load NFTs');
      }

      const result = await response.json();
      console.log('API Response:', result);

      const nftData = result.data?.nfts || result.data || [];
      setNfts(Array.isArray(nftData) ? nftData : []);
      
      if (!selectedNft && nftData.length > 0) {
        setSelectedNft(nftData[0]);
      }
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Loading NFTs...');
    loadNFTs();
  }, []);

  useEffect(() => {
    console.log('Current NFTs:', nfts);
  }, [nfts]);

  const handleNFTSelect = (nft: NFT) => {
    setSelectedNft(nft);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-[100vw] overflow-x-hidden px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">NFT Assets</h1>
          <p className="text-gray-400">Manage your digital assets and NFT collection</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-400 mb-2">Total NFTs</div>
            <div className="text-2xl font-bold text-white">{nfts.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Total Value</div>
            <div className="text-2xl font-bold text-white">$0.00</div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Listed NFTs</div>
            <div className="text-2xl font-bold text-white">0</div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Collections</div>
            <div className="text-2xl font-bold text-white">0</div>
          </div>
        </div>

        {/* Featured NFT Section */}
        {selectedNft && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Featured NFT</h2>
              <button 
                className="text-sm text-blue-400 hover:text-blue-300"
                onClick={() => setSelectedNft(nfts[Math.floor(Math.random() * nfts.length)])}
              >
                Show Another
              </button>
            </div>
            <div className="transform hover:scale-[1.01] transition-transform duration-200">
              <FeaturedNFT nft={selectedNft} />
            </div>
          </div>
        )}

        {/* NFT Gallery Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Your NFT Collection</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <select 
                className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm w-full sm:w-auto"
                onChange={(e) => console.log('Sort by:', e.target.value)}
              >
                <option value="recent">Recently Added</option>
                <option value="value">Highest Value</option>
                <option value="name">Name</option>
              </select>
              <input
                type="text"
                placeholder="Search NFTs..."
                className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm w-full sm:w-auto"
                onChange={(e) => console.log('Search:', e.target.value)}
              />
            </div>
          </div>
          <div className="min-h-[400px] max-h-[800px] overflow-y-auto">
            <NFTGallery 
              nfts={nfts} 
              isLoading={isLoading} 
              onViewDetails={handleNFTSelect}
              compact={false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 