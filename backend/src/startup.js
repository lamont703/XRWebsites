import dotenv from 'dotenv';
import { connectDB } from './database.js';
import { verifyStorage } from './utils/blobStorage.js';

dotenv.config();

const testConnections = async () => {
    console.log('Starting connection tests...');
    
    // Log environment status
    console.log('Environment variables present:', {
        cosmosDb: !!process.env.COSMOS_DB_ENDPOINT,
        blobStorage: !!process.env.AZURE_BLOB_SERVICE_SAS_URL,
        stripe: !!process.env.STRIPE_API_SECRET
    });

    console.log('Blob Storage SAS URL:', process.env.AZURE_BLOB_SERVICE_SAS_URL);

    try {
        // Test Cosmos DB using shared connection
        await connectDB();
        console.log('Cosmos DB connection successful');

        // Test Blob Storage using new method
        await verifyStorage();
        console.log('Blob Storage connection successful');

    } catch (error) {
        console.error('Connection test failed:', error);
        process.exit(1);
    }
};

export { testConnections }; 