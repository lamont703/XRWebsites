import styles from '@/styles/NFTListingCard.module.css';

interface NFTListingCardProps {
  listing: {
    id: string;
    nft_name?: string;
    nft_description?: string;
    image_url?: string;
    price: number;
    nft?: {
      name: string;
      description: string;
      image_url: string;
    };
  };
}

export const NFTListingCard = ({ listing }: NFTListingCardProps) => {
  const name = listing.nft?.name || listing.nft_name || 'Unnamed NFT';
  const description = listing.nft?.description || listing.nft_description || 'No description available';
  const imageUrl = listing.nft?.image_url || listing.image_url || '/placeholder-nft.png';

  return (
    <div className={styles.card}>
      <img 
        src={imageUrl}
        alt={name}
        className={styles.image}
      />
      <h3 className={styles.title}>{name}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.footer}>
        <div className={styles.price}>
          {listing.price} XRV
        </div>
        <button className={styles.button}>
          Purchase
        </button>
      </div>
    </div>
  );
}; 