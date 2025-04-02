import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getContainer } from "../database.js";
import { uploadToArweave } from '../utils/arweaveUploader.js'; // 👈 your uploader


const uploadMetadata = asyncHandler(async (req, res) => {
    try {
        const { metadataJson, network } = req.body;

        if (!metadataJson || !network) {
            throw new ApiError(400, "MetadataJson and network are required");
        }

        // Get database container
        //const container = await getContainer();

        // Create a new metadata document
        const metadataDoc = {
            id: `metadata-${Date.now()}`,
            type: 'metadata',
            metadataJson,
            network,
            userId: req.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Upload metadata to Arweave using UMI + Bundlr
        const arweaveUri = await uploadToArweave(metadataJson, network);
        console.log('Arweave URI:', arweaveUri);

        // Store in database
        //const { resource } = await container.items.create(metadataDoc);

        // Return success response with URI for frontend
        return res.status(201).json(
            new ApiResponse(201, {
                uri: arweaveUri
            }, "Metadata uploaded successfully")
        );
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