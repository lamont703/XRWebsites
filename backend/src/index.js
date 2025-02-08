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

// Basic health check for Azure warmup
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Start the server first, then connect to services
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    
    // Connect to services after server is listening
    connectDB().then(() => {
        console.log('Database connected successfully');
    }).catch((error) => {
        console.error('Database connection error:', error);
        // Don't exit process, just log the error
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