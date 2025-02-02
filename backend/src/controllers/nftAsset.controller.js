import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import NFTAsset from "../models/nftAsset.models.js";
import { uploadToAzureBlob, generateSasUrl, getSecureUrl } from "../utils/blobStorage.js";

const getAllNFTAssets = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        category, 
        price_min, 
        price_max,
        creator_id,
        wallet_id 
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (creator_id) query.creator_id = creator_id;
    if (wallet_id) query.owner_wallet_id = wallet_id;
    if (price_min !== undefined || price_max !== undefined) {
        query.price_range = [
            price_min ? Number(price_min) : null,
            price_max ? Number(price_max) : null
        ];
    }

    const result = await NFTAsset.find(query, { 
        page: parseInt(page), 
        limit: parseInt(limit) 
    });

    // Generate secure URLs for all NFT images
    for (let nft of result.nfts) {
        if (nft.image_url) {
            nft.image_url = await getSecureUrl(nft.image_url);
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "NFT assets retrieved successfully", result));
});

const createNFTAsset = asyncHandler(async (req, res) => {
    const { 
        name, 
        description, 
        category,
        price,
        metadata,
        owner_wallet_id 
    } = req.body;

    if (!name || !description || !owner_wallet_id) {
        throw new ApiError(400, "Name, description, and owner wallet ID are required");
    }

    let image_url = null;
    if (req.files?.image) {
        const result = await uploadToAzureBlob(req.files.image[0].path);
        const sasUrl = await generateSasUrl(result.blobName);
        image_url = sasUrl;
    }

    const nftData = {
        name,
        description,
        category,
        price: Number(price) || 0,
        metadata: metadata || {},
        image_url,
        owner_wallet_id,
        creator_id: req.user.id,
        status: "active",
        transfer_history: [{
            from: null,
            to: owner_wallet_id,
            timestamp: new Date(),
            transaction_type: "mint"
        }]
    };

    const nft = await NFTAsset.create(nftData);

    return res
        .status(201)
        .json(new ApiResponse(201, "NFT asset created successfully", nft));
});

const createNFTAssetReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
        throw new ApiError(400, "Rating and comment are required");
    }

    const review = {
        rating: Number(rating),
        comment,
        user_id: req.user.id,
        created_at: new Date()
    };

    const nft = await NFTAsset.addReview(id, review);

    return res
        .status(201)
        .json(new ApiResponse(201, "Review added successfully", nft));
});

const getNFTAssetById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const nft = await NFTAsset.findById(id);
    if (!nft) {
        throw new ApiError(404, "NFT not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "NFT retrieved successfully", nft));
});

const transferNFT = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { from_wallet_id, to_wallet_id } = req.body;

    if (!from_wallet_id || !to_wallet_id) {
        throw new ApiError(400, "Source and destination wallet IDs are required");
    }

    const nft = await NFTAsset.transferNFT(
        id, 
        from_wallet_id, 
        to_wallet_id, 
        req.user.id, 
        req.user.isAdmin
    );

    return res
        .status(200)
        .json(new ApiResponse(200, "NFT transferred successfully", nft));
});

const updateNFTAssetMetadata = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { metadata } = req.body;

    if (!metadata) {
        throw new ApiError(400, "Metadata is required");
    }

    const nft = await NFTAsset.updateMetadata(id, metadata, req.user.id);

    return res
        .status(200)
        .json(new ApiResponse(200, "NFT metadata updated successfully", nft));
});

const deleteNFTAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const nft = await NFTAsset.findById(id);
    if (!nft) {
        throw new ApiError(404, "NFT not found");
    }

    // Only creator or admin can delete
    if (nft.creator_id !== req.user.id && !req.user.isAdmin) {
        throw new ApiError(403, "Not authorized to delete this NFT");
    }

    await NFTAsset.deleteById(id);

    return res
        .status(200)
        .json(new ApiResponse(200, "NFT deleted successfully", null));
});

const getNFTAssetReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const nft = await NFTAsset.findById(id);
    if (!nft) {
        throw new ApiError(404, "NFT not found");
    }

    const reviews = await NFTAsset.getReviews(id, {
        page: parseInt(page),
        limit: parseInt(limit)
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "Reviews retrieved successfully", reviews));
});

const tokenizeNFTAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { token_supply, token_price } = req.body;

    if (!token_supply || !token_price) {
        throw new ApiError(400, "Token supply and price are required");
    }

    const nft = await NFTAsset.findById(id);
    if (!nft) {
        throw new ApiError(404, "NFT not found");
    }

    // Only creator can tokenize
    if (nft.creator_id !== req.user.id) {
        throw new ApiError(403, "Not authorized to tokenize this NFT");
    }

    const tokenizedNFT = await NFTAsset.tokenize(id, {
        token_supply: Number(token_supply),
        token_price: Number(token_price)
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "NFT tokenized successfully", tokenizedNFT));
});

export {
    getAllNFTAssets,
    createNFTAsset,
    getNFTAssetById,
    transferNFT,
    updateNFTAssetMetadata,
    createNFTAssetReview,
    deleteNFTAsset,
    getNFTAssetReviews,
    tokenizeNFTAsset
}; 