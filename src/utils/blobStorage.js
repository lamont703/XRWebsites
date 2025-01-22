import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Azure Blob Storage Configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);

const uploadToAzureBlob = async (localFilePath) => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            throw new Error("File not found");
        }

        // Get container client
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Ensure container exists
        await containerClient.createIfNotExists();

        // Generate unique blob name
        const blobName = `${Date.now()}-${path.basename(localFilePath)}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload file
        await blockBlobClient.uploadFile(localFilePath);

        // Delete local file
        fs.unlinkSync(localFilePath);

        return {
            url: blockBlobClient.url,
            success: true
        };

    } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
};

const deleteFromAzureBlob = async (publicUrl) => {
    try {   
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(publicUrl);
        const result = await blockBlobClient.deleteIfExists();
        console.log("File deleted from Azure Blob Storage:", result);
        return result;
    } catch (error) {
        console.error("Error deleting from Azure Blob Storage:", error);
        throw error;
    }
};

export { uploadToAzureBlob, deleteFromAzureBlob };