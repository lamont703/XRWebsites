import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import app from './server.js';
import connectDB from './database.js';
import cors from 'cors';

dotenv.config();

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add this before the environment variable check
console.log('Starting application...');
console.log('Environment:', process.env.NODE_ENV);

// Add this check before starting the server to ensure all required environment variables are set.
const requiredEnvVars = [
    'COSMOS_DB_ENDPOINT',
    'COSMOS_DB_KEY',
    'COSMOS_DB_DATABASE',
    'COSMOS_DB_CONTAINER',
    'AZURE_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_KEY',
    'AZURE_STORAGE_CONTAINER_NAME',
    'STRIPE_API_SECRET',
    'STRIPE_WEBHOOK_SECRET'
];

// Add this before your route handlers
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Basic health check endpoint that doesn't require DB connection
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'starting',
        timestamp: new Date().toISOString()
    });
});

// Add this before starting the server
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Force production mode in Azure
if (process.env.WEBSITE_SITE_NAME) {
    process.env.NODE_ENV = 'production';
}

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
}

// Azure App Service specific settings
const isAzure = process.env.WEBSITE_SITE_NAME !== undefined;
const port = process.env.PORT || 8080;

// Start the server
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

// Add this after your route handlers
app.use('*', (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});