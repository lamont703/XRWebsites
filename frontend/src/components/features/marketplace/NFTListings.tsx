import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth/useAuth';

interface NFTListing {
  id: string;
  nft_id: string;
  price: number;
  seller_wallet_id: string;
  expires_at: string;
  status: string;
  nft?: NFT;
}

export const NFTListings = () => {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/marketplace/listings`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load listings');
      }

      const data = await response.json();
      setListings(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  if (loading) return <div>Loading listings...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <div key={listing.id} className="bg-gray-800 rounded-lg p-6">
          <img 
            src={listing.nft?.image_url || '/placeholder-nft.png'}
            alt={listing.nft?.name}
            className="w-full aspect-square object-cover rounded-lg mb-4"
          />
          <h3 className="text-xl font-bold text-white mb-2">
            {listing.nft?.name || 'Unnamed NFT'}
          </h3>
          <p className="text-gray-400 mb-4">
            {listing.nft?.description || 'No description available'}
          </p>
          <div className="flex justify-between items-center">
            <div className="text-blue-400 font-bold">
              {listing.price} XRV
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white">
              Purchase
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 