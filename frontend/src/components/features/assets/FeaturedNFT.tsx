interface FeaturedNFTProps {
  nft: NFT;
}

export const FeaturedNFT = ({ nft }: FeaturedNFTProps) => {
  const name = nft.metadata?.name || nft.name || 'Unnamed NFT';
  const description = nft.metadata?.description || nft.description || 'No description available';
  const imageUrl = nft.metadata?.imageUrl || nft.image_url || '/placeholder-nft.png';
  const price = nft.metadata?.value || nft.value || 0;

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
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors">
              List for Sale
            </button>
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-white font-medium transition-colors">
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 