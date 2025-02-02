import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NFTMetadata {
  name: string;
  description: string;
  imageUrl: string;
  value: number;
}

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  value: number;
  metadata: NFTMetadata;
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
  compact = false,
  title = "Your NFTs" 
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
    <div className="w-full">
      <div className={`${compact ? 'h-[300px]' : 'h-[400px]'} overflow-y-auto`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400">Loading NFTs...</span>
          </div>
        ) : !nfts || nfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">No NFTs found in your collection</p>
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors">
              Mint Your First NFT
            </button>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {nfts.map((nft) => (
              <div 
                key={nft.id} 
                className="flex-none w-[280px] bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="aspect-square bg-gray-800 relative">
                  {!loadedImages[nft.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img 
                    src={getImageUrl(nft)}
                    alt={nft.metadata?.name || nft.name || 'NFT Image'}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages[nft.id] ? 'opacity-100' : 'opacity-0'}`}
                    onError={(e) => handleImageError(e, nft.id)}
                    onLoad={() => handleImageLoad(nft.id)}
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-white font-medium text-lg mb-1 truncate">
                    {nft.metadata?.name || nft.name || 'Unnamed NFT'}
                  </h4>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                    {nft.metadata?.description || nft.description || 'No description available'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 font-bold">
                      ${(nft.metadata?.value || nft.value || 0).toFixed(2)}
                    </span>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm text-white transition-colors"
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