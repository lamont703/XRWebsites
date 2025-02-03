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


//create express app
const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Regular body parser for JSON requests
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/v1/payments/webhook')) {
            req.rawBody = buf;
        }
    }
}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb",
}));

app.use(express.static("public"));
app.use(cookieParser());

// use routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/tokenomics", tokenomicsRouter);
app.use("/api/v1/payments", paymentRouter);


// Add this before other middleware for webhook
app.post('/api/v1/payments/webhook', express.raw({type: 'application/json'}));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
