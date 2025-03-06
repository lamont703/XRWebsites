import { useEffect, useState } from 'react';
import { NFTListingCard } from './NFTListingCard';
import styles from '@/styles/NFTListings.module.css';

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

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

  if (loading) return <div className={styles.loadingText}>Loading listings...</div>;
  if (error) return <div className={styles.errorText}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {listings.map((listing) => (
          <NFTListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}; 