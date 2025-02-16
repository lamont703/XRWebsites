import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/error.middleware.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import walletRouter from "./routes/wallet.routes.js";
import jobRouter from "./routes/job.routes.js";
import tokenomicsRouter from "./routes/tokenomicsRouter.js";
import paymentRouter from "./routes/payment.routes.js";
import marketplaceRouter from "./routes/marketplace.routes.js";
import forumRoutes from './routes/forum.routes.js';
import dotenv from 'dotenv';

dotenv.config();

// Create express app
const app = express();

// Essential middleware (should come first)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
const corsOptions = {
    origin: process.env.SITE_NAME  
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://xrwebsites-frontend-hzdgbhcbfvdhb8fn.eastus2-01.azurewebsites.net']
        : ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ]
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Log CORS configuration for debugging
console.log('CORS configuration:', {
    allowedOrigins: corsOptions.origin,
    credentials: corsOptions.credentials
});

// Add after the CORS configuration and before other routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "XR Websites API",
        version: process.env.npm_package_version || "1.0.0",
        status: "operational",
        environment: process.env.NODE_ENV || "production",
        timestamp: new Date().toISOString(),
        endpoints: {
            health: "/health",
            services: "/health/services"
        }
    });
});

// Regular body parser for URL encoded requests to handle webhook requests from Stripe.
app.use(express.urlencoded({
    extended: true,
    limit: "16kb",
}));
 
// Serve static files from the public directory for frontend build.
app.use(express.static("public"));

// Add this near your other middleware
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Mount the healthcheck routes
app.use('/health', healthcheckRouter);

// Use api routes for  authentication, healthcheck, wallet, jobs, tokenomics, payments, and marketplace.
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/tokenomics", tokenomicsRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/marketplace", marketplaceRouter);
app.use('/api/v1/forum', forumRoutes);

// Add this before other middleware for webhook requests from Stripe.
app.post('/api/v1/payments/webhook', express.raw({type: 'application/json'}));

// Error handling middleware to handle errors in the app.
app.use(errorHandler);

// 404 handler middleware to handle routes not found.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
