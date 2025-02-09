import dotenv from 'dotenv';
import app from './server.js';
import { connectDB } from './database.js';

// Define required environment variables
const requiredEnvVars = [
    'COSMOS_DB_ENDPOINT',
    'COSMOS_DB_KEY',
    'COSMOS_DB_DATABASE',
    'COSMOS_DB_CONTAINER',
    'AZURE_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_KEY',
    'AZURE_STORAGE_CONTAINER_NAME'
];

// Environment setup (keep your existing environment setup code)
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (process.env.SITE_NAME) {
    process.env.NODE_ENV = 'production';
}

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// Azure App Service specific settings
const isAzure = process.env.SITE_NAME !== undefined;

const port = process.env.PORT || 8080;

// Initialize server with database connection
const startServer = async () => {
    try {
        // Connect to database first
        await connectDB();
        console.log('✅ Database connected successfully');

        // Then start the server
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server listening on port ${port}`);
            if (isAzure) {
                console.log('Azure App Service detected, using port:', port);
            }

            // Check environment variables
            const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
            
            if (missingVars.length > 0) {
                console.error('❌ Missing required environment variables:', missingVars);
            } else {
                console.log('✅ All required environment variables present');
            }
        });

    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
};

// Start the server
startServer();