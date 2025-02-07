import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import app from './server.js';
import connectDB from './database.js';

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables with explicit path for local development.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Add this check before starting the server to ensure all required environment variables are set.
const requiredEnvVars = [
    'COSMOS_DB_ENDPOINT',
    'COSMOS_DB_KEY',
    'COSMOS_DB_NAME',
    'COSMOS_DB_CONTAINER',
    'AZURE_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_KEY',
    'AZURE_STORAGE_CONTAINER_NAME',
    'STRIPE_API_SECRET',
    'STRIPE_WEBHOOK_SECRET'
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Required environment variable ${envVar} is missing`);
        console.error('Available environment variables:', Object.keys(process.env));
        process.exit(1);
    }
}

// Add this before your route handlers
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Start the server and connect to the database.
const startServer = async () => {
    try {
        await connectDB();
        // Azure App Service sets process.env.PORT to 8080
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            // Log all environment variables for debugging (excluding sensitive values)
            console.log('Environment variables available:', 
                Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('SECRET')));
        });
    } catch (error) {
        console.error('Error starting server:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

// Add this after your route handlers
app.use('*', (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

startServer();