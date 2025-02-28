import TokenModel from '../models/token.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const createToken = asyncHandler(async (req, res) => {
    const {
        mint,
        name,
        symbol,
        decimals,
        totalSupply,
        owner,
        features,
        metadata
    } = req.body;

    if (!mint || !name || !symbol || !decimals || !totalSupply || !owner) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const tokenExists = await TokenModel.findOne({ mint });
    if (tokenExists) {
        throw new ApiError(409, "Token with this mint address already exists");
    }

    const token = await TokenModel.create({
        type: 'token',
        mint,
        name,
        symbol,
        decimals,
        totalSupply,
        owner,
        features,
        metadata
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Token created successfully", token));
});

const getTokens = asyncHandler(async (req, res) => {
    const tokens = await TokenModel.find({ type: 'token' });
    return res
        .status(200)
        .json(new ApiResponse(200, "Tokens fetched successfully", tokens));
});

const getTokenByMint = asyncHandler(async (req, res) => {
    const token = await TokenModel.findOne({ 
        type: 'token',
        mint: req.params.mint 
    });

    if (!token) {
        throw new ApiError(404, "Token not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Token fetched successfully", token));
});

const updateToken = asyncHandler(async (req, res) => {
    const { mint } = req.params;
    const updates = req.body;

    const token = await TokenModel.findByMint(mint);
    if (!token) {
        throw new ApiError(404, "Token not found");
    }

    // Add update logic here using CosmosDB
    const updatedToken = {
        ...token,
        ...updates,
        updated_at: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(updatedToken);

    return res
        .status(200)
        .json(new ApiResponse(200, "Token updated successfully", resource));
});

const deleteToken = asyncHandler(async (req, res) => {
    const { mint } = req.params;
    
    const token = await TokenModel.findByMint(mint);
    if (!token) {
        throw new ApiError(404, "Token not found");
    }

    // Soft delete by updating status
    const deletedToken = {
        ...token,
        status: 'deleted',
        updated_at: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(deletedToken);

    return res
        .status(200)
        .json(new ApiResponse(200, "Token deleted successfully", resource));
});

export {
    createToken,
    getTokens,
    getTokenByMint,
    updateToken,
    deleteToken
}; 