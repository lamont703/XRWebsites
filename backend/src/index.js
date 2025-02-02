import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import app from './app.js';
import connectDB from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Add this check before starting the server
const requiredEnvVars = ['STRIPE_API_SECRET', 'STRIPE_WEBHOOK_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Required environment variable ${envVar} is missing`);
        console.error('Available environment variables:', Object.keys(process.env));
        process.exit(1);
    }
}

const startServer = async () => {
    try {
        await connectDB();
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();