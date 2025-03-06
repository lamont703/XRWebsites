import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '@/store/auth/Auth';
import styles from '@/styles/Assets.module.css';
import { useLocation } from 'react-router-dom';
import { NFTGallery } from '@/components/features/wallet/NFTGallery';
import type { NFT } from '@/components/features/wallet/NFTGallery';
import { FeaturedNFT } from '../components/features/assets/FeaturedNFT';
import { CreateNFT, NFTData } from '../components/features/assets/CreateNFT';

export const Assets = () => {
  const {} = useAuth();
  const { state } = useLocation();
  const [selectedNft, setSelectedNft] = useState<NFT | null>(state?.selectedNft || null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState({ id: '' });
  const [showCreateNFT, setShowCreateNFT] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleCreateNFT = async (nftData: NFTData) => {
    try {
      if (!walletData.id) {
        throw new Error('No wallet connected');
      }

      // First, upload image to IPFS (mock for now)
      const imageUrl = '/placeholder-nft.png'; // TODO: Implement IPFS upload

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${walletData.id}/nfts/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: nftData.name,
            description: nftData.description,
            image_url: imageUrl,
            owner_wallet_id: walletData.id,
            metadata: {
              name: nftData.name,
              description: nftData.description,
              imageUrl: imageUrl,
              attributes: nftData.attributes,
              royalties: nftData.royalties,
              supply: nftData.supply
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create NFT');
      }

      setSuccess('NFT created successfully!');
      setShowCreateNFT(false);
      loadNFTs(); // Refresh the NFT list

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create NFT');
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>NFT Assets</h1>
          <p className={styles.subtitle}>Manage your digital assets and NFT collection</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total NFTs</div>
            <div className={styles.statValue}>{nfts.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Value</div>
            <div className={styles.statValue}>$0.00</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Listed NFTs</div>
            <div className={styles.statValue}>0</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Collections</div>
            <div className={styles.statValue}>0</div>
          </div>
        </div>

        {selectedNft && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Featured NFT</h2>
              <button 
                className={styles.actionButton}
                onClick={() => setSelectedNft(nfts[Math.floor(Math.random() * nfts.length)])}
              >
                Show Another
              </button>
            </div>
            <FeaturedNFT nft={selectedNft} />
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Create New NFT</h2>
            <button
              onClick={() => setShowCreateNFT(!showCreateNFT)}
              className={styles.actionButton}
            >
              {showCreateNFT ? 'Cancel' : '+ Create NFT'}
            </button>
          </div>
          {showCreateNFT && (
            <CreateNFT
              onSubmit={handleCreateNFT}
              onCancel={() => setShowCreateNFT(false)}
            />
          )}
        </div>

        <div className={styles.galleryContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your NFT Collection</h2>
            <div className={styles.filterBar}>
              <select 
                className={styles.select}
                onChange={(e) => console.log('Sort by:', e.target.value)}
                title="Sort NFTs by"
              >
                <option value="recent">Recently Added</option>
                <option value="value">Highest Value</option>
                <option value="name">Name</option>
              </select>
              <input
                type="text"
                placeholder="Search NFTs..."
                className={styles.input}
                onChange={(e) => console.log('Search:', e.target.value)}
              />
            </div>
          </div>
          <NFTGallery 
            nfts={nfts} 
            isLoading={isLoading} 
            onViewDetails={handleNFTSelect}
            compact={false}
          />
        </div>

        {success && (
          <div className={styles.successMessage}>{success}</div>
        )}

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}
      </div>
    </MainLayout>
  );
}; 