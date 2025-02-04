import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getContainer } from "../database.js";

const getActiveListings = asyncHandler(async (req, res) => {
    try {
        const container = await getContainer();
        
        // Get all active listings with their NFT data
        const { resources: listings } = await container.items
            .query({
                query: `
                    SELECT 
                        l.*,
                        n.name as nft_name,
                        n.description as nft_description,
                        n.image_url,
                        n.metadata
                    FROM c l
                    JOIN n IN c
                    WHERE l.type = 'nft_listing' 
                    AND l.status = 'active'
                    AND n.id = l.nft_id
                    AND n.type = 'nft'
                `
            })
            .fetchAll();

        return res
            .status(200)
            .json(new ApiResponse(200, "Listings retrieved successfully", listings));
    } catch (error) {
        throw new ApiError(500, "Failed to retrieve marketplace listings");
    }
});

export { getActiveListings }; 