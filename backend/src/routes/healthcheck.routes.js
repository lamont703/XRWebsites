import { Router } from "express";
import { getContainer } from "../database.js";
import { blobServiceClient } from "../utils/blobStorage.js";
import dotenv from 'dotenv';

dotenv.config();

// Create a router for healthcheck routes.
const router = Router();

// Basic healthcheck
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed service healthcheck
router.get('/services', async (req, res) => {
    try {
        let status = {
            database: process.env.COSMOS_DB_DATABASE,
            blobStorage: 'checking...'
        };

        // Test database connection
        try {
            const container = await getContainer();
            const { resources } = await container.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll();
            status.database = 'connected';
        } catch (dbError) {
            console.error('Database health check failed:', dbError);
            status.database = 'error: ' + dbError.message;
        }

        // Test blob storage connection
        try {
            console.log('Testing blob storage connection...');
            const containerClient = blobServiceClient.getContainerClient("uploads");
            const exists = await containerClient.exists();
            
            if (exists) {
                status.blobStorage = 'connected';
                console.log('✅ Blob Storage container verified');
            } else {
                status.blobStorage = 'warning: container not found';
                console.log('⚠️ Blob Storage container not found');
            }
        } catch (blobError) {
            console.error('Blob storage health check failed:', {
                error: blobError.message,
                code: blobError.code,
                statusCode: blobError.statusCode,
                details: blobError.details
            });
            status.blobStorage = 'error: ' + blobError.message;
        }

        const isHealthy = status.database === 'connected' && 
                         (status.blobStorage === 'connected' || status.blobStorage === 'warning: container not found');

        res.status(isHealthy ? 200 : 500).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            services: status,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;