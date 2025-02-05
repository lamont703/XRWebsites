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

//create express app and use middlewares to handle cors and webhook requests from Stripe.
const app = express();

// Middlewares to handle cors and webhook requests from Stripe.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Regular body parser for JSON requests to handle webhook requests from Stripe.
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/v1/payments/webhook')) {
            req.rawBody = buf;
        }
    }
}));

// Regular body parser for URL encoded requests to handle webhook requests from Stripe.
app.use(express.urlencoded({
    extended: true,
    limit: "16kb",
}));
 
// Serve static files from the public directory for frontend build.
app.use(express.static("public"));

// Use cookie parser to handle cookies for authentication.
app.use(cookieParser());

// Use api routes for authentication, healthcheck, wallet, jobs, tokenomics, payments, and marketplace.
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
