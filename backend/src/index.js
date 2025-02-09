import dotenv from 'dotenv';
import app from './server.js';
import { connectDB } from './database.js';
import { CosmosClient } from '@azure/cosmos';

console.log('Starting application...');

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
    const startupTimeout = setTimeout(() => {
        console.error('❌ Server startup timed out after 180s');
        process.exit(1);
    }, 180000);

    try {
        console.log('Attempting database connection...');
        console.log('Database endpoint:', process.env.COSMOS_DB_ENDPOINT);
        
        // Test database connection first
        const testConnection = async () => {
            try {
                const client = new CosmosClient({
                    endpoint: process.env.COSMOS_DB_ENDPOINT,
                    key: process.env.COSMOS_DB_KEY,
                });
                await client.databases.readAll().fetchAll();
                return true;
            } catch (error) {
                console.error('Database test connection failed:', {
                    message: error.message,
                    code: error.code,
                    statusCode: error.statusCode,
                    requestCharge: error.requestCharge
                });
                return false;
            }
        };

        // Try connection with retries
        let retries = 3;
        let connected = false;
        
        while (retries > 0 && !connected) {
            console.log(`Database connection attempt ${4 - retries}/3...`);
            connected = await Promise.race([
                testConnection(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection attempt timed out')), 20000)
                )
            ]);
            
            if (!connected && retries > 1) {
                console.log('Retrying database connection in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            retries--;
        }

        if (!connected) {
            throw new Error('Failed to connect to database after 3 attempts');
        }

        console.log('✅ Database connection test successful');

        // Now proceed with actual connection
        await connectDB();
        console.log('✅ Database connected successfully');

        // Then start the server
        const server = app.listen(port, '0.0.0.0', () => {
            clearTimeout(startupTimeout);
            console.log(`Server listening on port ${port}`);
            console.log('Environment:', process.env.NODE_ENV);
            console.log('Port:', process.env.PORT);

            // Check environment variables
            const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
            
            if (missingVars.length > 0) {
                console.error('❌ Missing required environment variables:', missingVars);
            } else {
                console.log('✅ All required environment variables present');
            }
        });

        // Add error handler
        server.on('error', (error) => {
            console.error('❌ Server error:', {
                message: error.message,
                code: error.code,
                errno: error.errno
            });
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Server startup failed:', {
            error: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        process.exit(1);
    }
};

// Start the server
startServer();