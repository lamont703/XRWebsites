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
    <div className="bg-gray-800 rounded-lg p-6">
      <img 
        src={imageUrl}
        alt={name}
        className="w-full aspect-square object-cover rounded-lg mb-4"
      />
      <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <div className="text-blue-400 font-bold">
          {listing.price} XRV
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white">
          Purchase
        </button>
      </div>
    </div>
  );
}; 