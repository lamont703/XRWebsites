import dotenv from 'dotenv';
import { connectDB } from './database.js';
import { BlobServiceClient } from "@azure/storage-blob";

dotenv.config();

const testConnections = async () => {
    console.log('Starting connection tests...');
    
    // Log environment status
    console.log('Environment variables present:', {
        cosmosDb: !!process.env.COSMOS_DB_ENDPOINT,
        blobStorage: !!process.env.AZURE_STORAGE_ACCOUNT_NAME,
        stripe: !!process.env.STRIPE_API_SECRET
    });

    try {
        // Test Cosmos DB using shared connection
        await connectDB();
        console.log('Cosmos DB connection successful');

        // Test Blob Storage
        const blobClient = BlobServiceClient.fromConnectionString(
            `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`
        );
        await blobClient.getProperties();
        console.log('Blob Storage connection successful');

    } catch (error) {
        console.error('Connection test failed:', error);
        process.exit(1);
    }
};

testConnections(); 