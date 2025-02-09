import dotenv from 'dotenv';
import app from './server.js';
import { connectDB } from './database.js';

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
        // Connect to database first with increased timeout
        await Promise.race([
            connectDB().catch(err => {
                console.error('Database connection error details:', {
                    message: err.message,
                    code: err.code,
                    stack: err.stack
                });
                throw err;
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database connection timeout after 60s')), 60000)
            )
        ]);
        console.log('✅ Database connected successfully');

        // Then start the server
        const server = app.listen(port, '0.0.0.0', () => {
            clearTimeout(startupTimeout);
            console.log(`Server listening on port ${port}`);
            console.log('Environment:', process.env.NODE_ENV);
            console.log('Port:', process.env.PORT);
            console.log('Database endpoint:', process.env.COSMOS_DB_ENDPOINT);

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
            console.error('❌ Server error:', error);
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