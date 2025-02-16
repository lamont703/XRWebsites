import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

if (!process.env.AZURE_BLOB_SERVICE_SAS_URL) {
    throw new Error('Azure Blob Service SAS URL is missing. Please check your .env file.');
}

// Create BlobServiceClient using the storage SAS URL
const blobServiceClient = new BlobServiceClient(process.env.AZURE_BLOB_SERVICE_SAS_URL);

// Verify storage connection
export const verifyStorage = async () => {
    try {
        // Test access to the blob storage account
        console.log('Testing access to Blob Storage account...');
        const accountInfo = await blobServiceClient.getAccountInfo();
        console.log('Blob Storage account access successful:', accountInfo);

        const containerName = "xrwebsites-container";
        const containerClient = blobServiceClient.getContainerClient(containerName);
        console.log('Container client:', containerClient);

        // Create the new container if it doesn't exist
        console.log(`Creating container '${containerName}' if it doesn't exist...`);
        await containerClient.createIfNotExists();
        console.log(`✅ Container '${containerName}' is ready for use`);

        return true;
    } catch (error) {
        console.error('❌ Error connecting to Blob Storage:', error.message);
        throw error;
    }
};

// Debug console to verify connection
(async () => {
    try {
        await verifyStorage();
    } catch (error) {
        console.error('Debug: Connection verification failed:', error);
    }
})();

const uploadToAzureBlob = async (localFilePath) => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            throw new Error("File not found");
        }

        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";
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
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";
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
        if (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_SAS_TOKEN) {
            console.warn('Azure Storage credentials not configured, returning original blob name');
            return blobName;
        }

        // Debug: Log the presence of environment variables
        console.log('Azure Storage Account Name:', process.env.AZURE_STORAGE_ACCOUNT_NAME ? 'Set' : 'Missing');
        console.log('Azure SAS Token:', process.env.AZURE_SAS_TOKEN ? 'Set' : 'Missing');

        // Extract just the blob name from the full URL if it's a full URL
        const actualBlobName = blobName.includes('blob.core.windows.net') 
            ? blobName.split('/').pop() 
            : blobName;

        // Debug: Log the actual blob name
        console.log('Actual Blob Name:', actualBlobName);

        // Construct the URL with SAS token
        const baseUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
        const containerPath = '/uploads';
        const sasToken = process.env.AZURE_SAS_TOKEN.startsWith('?') 
            ? process.env.AZURE_SAS_TOKEN 
            : `?${process.env.AZURE_SAS_TOKEN}`;

        // Debug: Log the constructed URL
        const sasUrl = `${baseUrl}${containerPath}/${actualBlobName}${sasToken}`;
        console.log('Generated SAS URL:', sasUrl);

        return sasUrl;
    } catch (error) {
        console.error('Generate SAS URL error:', error);
        return blobName;
    }
};

export const getSecureUrl = async (blobName) => {
    if (!blobName) return null;
    return await generateSasUrl(blobName);
};

export { uploadToAzureBlob, deleteFromAzureBlob, blobServiceClient };