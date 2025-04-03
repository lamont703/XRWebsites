import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getContainer } from "../database.js";
import { uploadToArweave } from '../utils/arweaveUploader.js'; // 👈 your uploader

const uploadMetadata = asyncHandler(async (req, res) => {
    try {
        const { metadataJson, network: requestedNetwork, mintAddress } = req.body;
        const userSignature = req.headers['x-user-signature'];
        const walletPublicKey = req.headers['x-wallet-public-key'];
        
        // Define network BEFORE using it in the validation
        const network = requestedNetwork?.network || requestedNetwork;
        
        if (!metadataJson || !network || !mintAddress || !userSignature || !walletPublicKey) {
            throw new ApiError(400, "Missing required parameters");
        }

        // Upload metadata to Arweave and attach to token
        const { uri, signature } = await uploadToArweave(
            metadataJson, 
            network, 
            mintAddress,
            userSignature,
            walletPublicKey
        );
        console.log('Arweave URI:', uri);
        console.log('Transaction Signature:', signature);

        // Store in database
        //const { resource } = await container.items.create(metadataDoc);

        // Return success response with URI and signature
        return res.status(201).json({
            data: {
                uri: uri,
                signature: signature
            }
        });
    } catch (error) {
        console.error("Metadata upload error:", error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to upload metadata",
            error.errors
        );
    }
});

export { uploadMetadata };