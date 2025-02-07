import dotenv from 'dotenv';
import { CosmosClient } from "@azure/cosmos";
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
        // Test Cosmos DB
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            key: process.env.COSMOS_DB_KEY,
        });
        await client.databases.readAll().fetchAll();
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