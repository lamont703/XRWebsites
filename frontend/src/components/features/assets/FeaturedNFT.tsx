import { useState } from 'react';
import {} from '@/store/auth/Auth';

interface NFT {
  id: string;
  owner_wallet_id: string;
  name?: string;
  description?: string;
  image_url?: string;
  value?: number;
  metadata?: {
    name?: string;
    description?: string;
    imageUrl?: string;
    value?: number;
  };
}

interface FeaturedNFTProps {
  nft: NFT;
  onListingSuccess?: (data: any) => void;
}

interface ListingFormData {
  price: number;
  duration: number;
}

export const FeaturedNFT = ({ nft, onListingSuccess }: FeaturedNFTProps) => {
  const [showListingForm, setShowListingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [listingData, setListingData] = useState<ListingFormData>({
    price: 0,
    duration: 7 // Default 7 days
  });

  const name = nft.metadata?.name || nft.name || 'Unnamed NFT';
  const description = nft.metadata?.description || nft.description || 'No description available';
  const imageUrl = nft.metadata?.imageUrl || nft.image_url || '/placeholder-nft.png';
  const price = nft.metadata?.value || nft.value || 0;

  const handleListNFT = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/wallet/${nft.owner_wallet_id}/nfts/${nft.id}/list`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(listingData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list NFT');
      }

      const data = await response.json();
      setSuccess('NFT listed successfully!');
      setShowListingForm(false);
      onListingSuccess?.(data.data); // Notify parent component

      setTimeout(() => {
        setSuccess(null);
      }, 10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list NFT');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="aspect-square w-full">
          <img 
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
            <p className="text-gray-400 text-lg mb-4">{description}</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Current Value</div>
                <div className="text-xl font-bold text-blue-400">${price.toFixed(2)}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Collection</div>
                <div className="text-xl font-bold text-white">Featured</div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {!showListingForm ? (
              <button 
                onClick={() => setShowListingForm(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors"
              >
                List for Sale
              </button>
            ) : (
              <div className="w-full p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Price (XRV)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={listingData.price}
                      onChange={(e) => setListingData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full bg-gray-700 rounded-lg p-2 text-white"
                      title="NFT listing price"
                      placeholder="Enter price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={listingData.duration}
                      onChange={(e) => setListingData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full bg-gray-700 rounded-lg p-2 text-white"
                      title="Listing duration in days"
                      placeholder="Enter number of days"
                    />
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm">{error}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleListNFT}
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Listing...' : 'Confirm Listing'}
                    </button>
                    <button
                      onClick={() => setShowListingForm(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4">
          <p className="text-green-500">{success}</p>
        </div>
      )}
    </div>
  );
}; 