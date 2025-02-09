import dotenv from 'dotenv';
import app from './server.js';
import { connectDB } from './database.js';

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (process.env.SITE_NAME) {
    process.env.NODE_ENV = 'production';
}

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const port = process.env.PORT || 8080;

// Initialize server with database connection
const startServer = async () => {
    try {
        // Connect to database
        console.log('Connecting to database...');
        await connectDB();
        console.log('✅ Database connected successfully');

        // Start the server
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server listening on port ${port}`);
            console.log('Environment:', process.env.NODE_ENV);
        });

    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
};

// Start the server
console.log('Starting application...');
startServer();