import React, { useState } from 'react';
import styles from '@/styles/NFTGallery.module.css';

interface NFTMetadata {
  name: string;
  description: string;
  imageUrl: string;
  image_url?: string;
  image?: string;
  value: number;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  imageUrl?: string;
  image?: string;
  value: number;
  metadata: NFTMetadata;
  owner_wallet_id: string;
}

interface NFTGalleryProps {
  nfts: NFT[];
  isLoading: boolean;
  onViewDetails?: (nft: NFT) => void;
  compact?: boolean;
  title?: string;
}

export const NFTGallery = ({ 
  nfts, 
  isLoading, 
  onViewDetails, 
  compact = false 
}: NFTGalleryProps) => {
  const PLACEHOLDER_IMAGE = '/assets/images/placeholder-nft.jpg';
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, nftId: string) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
    setLoadedImages(prev => ({ ...prev, [nftId]: true }));
    e.currentTarget.onerror = null;
  };

  const handleImageLoad = (nftId: string) => {
    setLoadedImages(prev => ({ ...prev, [nftId]: true }));
  };

  const getImageUrl = (nft: NFT): string => {
    return nft.metadata?.imageUrl || 
           nft.metadata?.image_url || 
           nft.metadata?.image || 
           nft.image_url || 
           nft.imageUrl || 
           nft.image || 
           PLACEHOLDER_IMAGE;
  };

  return (
    <div className={styles.galleryContainer}>
      <div className={compact ? styles.galleryScrollCompact : styles.galleryScroll}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <span className={styles.emptyText}>Loading NFTs...</span>
          </div>
        ) : !nfts || nfts.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No NFTs found in your collection</p>
            <button className={styles.button}>
              Mint Your First NFT
            </button>
          </div>
        ) : (
          <div className={styles.nftGrid}>
            {nfts.map((nft) => (
              <div key={nft.id} className={styles.nftCard}>
                <div className={styles.imageContainer}>
                  {!loadedImages[nft.id] && (
                    <div className={styles.loadingSpinner}>
                      <div className={styles.spinner} />
                    </div>
                  )}
                  <img 
                    src={getImageUrl(nft)}
                    alt={nft.metadata?.name || nft.name || 'NFT Image'}
                    className={`${styles.nftImage} ${loadedImages[nft.id] ? styles.imageVisible : styles.imageHidden}`}
                    onError={(e) => handleImageError(e, nft.id)}
                    onLoad={() => handleImageLoad(nft.id)}
                    loading="lazy"
                  />
                </div>
                <div className={styles.nftContent}>
                  <h4 className={styles.nftTitle}>
                    {nft.metadata?.name || nft.name || 'Unnamed NFT'}
                  </h4>
                  <p className={styles.nftDescription}>
                    {nft.metadata?.description || nft.description || 'No description available'}
                  </p>
                  <div className={styles.nftFooter}>
                    <span className={styles.nftPrice}>
                      ${(nft.metadata?.value || nft.value || 0).toFixed(2)}
                    </span>
                    <button 
                      className={styles.button}
                      onClick={() => onViewDetails?.(nft)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 