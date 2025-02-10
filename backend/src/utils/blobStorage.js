import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Force reload environment variables
dotenv.config({ override: true });

// Enhanced debugging
console.log('Blob Storage Configuration:');
console.log('Connection String:', process.env.AZURE_STORAGE_CONNECTION_STRING ? 'Set' : 'Missing');
console.log('Container Name:', process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads (default)');

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('Azure Storage connection string is missing. Please check your .env file.');
}

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

// Create the BlobServiceClient using the connection string
export const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Verify storage connection
export const verifyStorage = async () => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const exists = await containerClient.exists();
        if (exists) {
            console.log('✅ Blob Storage connected successfully');
            return true;
        } else {
            console.log('⚠️ Container not found, will be created when needed');
            return false;
        }
    } catch (error) {
        console.error('❌ Error connecting to Blob Storage:', error.message);
        throw error;
    }
};

// Call verification on module load
verifyStorage().catch(console.error);

const uploadToAzureBlob = async (localFilePath) => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            throw new Error("File not found");
        }

        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        const blobName = `${Date.now()}-${path.basename(localFilePath)}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadFile(localFilePath);
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

export const generateSasUrl = async (blobName) => {
    try {
        if (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_SAS_TOKEN) {
            console.warn('Azure Storage credentials not configured, returning original blob name');
            return blobName;
        }

        // Extract just the blob name from the full URL if it's a full URL
        const actualBlobName = blobName.includes('blob.core.windows.net') 
            ? blobName.split('/').pop() 
            : blobName;

        // Construct the URL with SAS token
        const baseUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
        const containerPath = '/uploads';
        const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN.startsWith('?') 
            ? process.env.AZURE_STORAGE_SAS_TOKEN 
            : `?${process.env.AZURE_STORAGE_SAS_TOKEN}`;

        return `${baseUrl}${containerPath}/${actualBlobName}${sasToken}`;
    } catch (error) {
        console.error('Generate SAS URL error:', error);
        return blobName;
    }
};

export const getSecureUrl = async (blobName) => {
    if (!blobName) return null;
    return await generateSasUrl(blobName);
};

export { uploadToAzureBlob, deleteFromAzureBlob };