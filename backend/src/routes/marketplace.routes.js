import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getContainer } from '../database.js';

const router = express.Router();

router.get('/listings', verifyJWT, async (req, res) => {
  try {
    const container = await getContainer();
    const { resources: listings } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'nft_listing' AND c.status = 'active'"
      })
      .fetchAll();

    // Fetch associated NFTs
    const nftIds = listings.map(listing => listing.nft_id);
    const { resources: nfts } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'nft' AND c.id IN (@nftIds)",
        parameters: [{ name: "@nftIds", value: nftIds }]
      })
      .fetchAll();

    // Combine listings with NFT data
    const listingsWithNFTs = listings.map(listing => ({
      ...listing,
      nft: nfts.find(nft => nft.id === listing.nft_id)
    }));

    res.status(200).json(new ApiResponse(200, "Listings retrieved successfully", listingsWithNFTs));
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve listings");
  }
}); 

export default router;