import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import app from './server.js';
import connectDB from './database.js';

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config();

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

// Start the server first
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    
    // Then check environment variables
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars);
        console.error('Available variables:', Object.keys(process.env)
            .filter(key => !key.includes('KEY') && !key.includes('SECRET')));
        // Don't exit - let the health check endpoint still work
    }
    
    // Finally try to connect to services
    connectDB().then(() => {
        console.log('Database connected successfully');
    }).catch((error) => {
        console.error('Database connection failed:', error.message);
        // Don't exit - let the health check endpoint still work
    });
});

// Add this after your route handlers
app.use('*', (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});