import Stripe from 'stripe';
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Wallet from "../models/wallet.models.js";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug environment variables
console.log('Environment variables loaded from:', path.resolve(__dirname, '../../.env'));
console.log('Available env vars:', Object.keys(process.env));
console.log('STRIPE_API_SECRET length:', process.env.STRIPE_API_SECRET?.length);
console.log('STRIPE_API_SECRET prefix:', process.env.STRIPE_API_SECRET?.substring(0, 7));

// Initialize Stripe with error handling
let stripe;
const initializeStripe = async () => {
    try {
        if (!process.env.STRIPE_API_SECRET) {
            console.error('❌ STRIPE_API_SECRET is missing');
            return null;
        }

        // Clean and validate key
        const apiKey = process.env.STRIPE_API_SECRET.trim();
        console.log('🔑 API Key validation:', {
            length: apiKey.length,
            startsWithCorrectPrefix: apiKey.startsWith('sk_test_'),
            firstChars: apiKey.substring(0, 7)
        });

        const stripeInstance = new Stripe(apiKey, {
            apiVersion: '2023-10-16',
            typescript: false
        });

        // Test the connection
        try {
            await stripeInstance.paymentIntents.list({ limit: 1 });
            console.log('✅ Stripe connection test successful');
            return stripeInstance;
        } catch (error) {
            console.error('❌ Stripe test failed:', {
                type: error.type,
                message: error.message,
                requestId: error.requestId
            });
            return null;
        }
    } catch (error) {
        console.error('❌ Stripe initialization error:', error.message);
        return null;
    }
};

// Initialize stripe immediately
(async () => {
    stripe = await initializeStripe();
})();

const createPaymentIntent = asyncHandler(async (req, res) => {
    if (!stripe) {
        console.error('Attempting to reinitialize Stripe...');
        stripe = await initializeStripe();
        
        if (!stripe) {
            throw new ApiError(500, "Payment service unavailable - Stripe initialization failed");
        }
    }
    
    const { amount } = req.body;
    const { id: userId } = req.user;

    console.log('Creating payment intent for user:', userId, 'amount:', amount);

    try {
        const wallet = await Wallet.findOne({ user_id: userId });
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            metadata: {
                walletId: wallet.id,
                userId
            },
            payment_method_types: ['card']
        });

        console.log('✅ Payment intent created successfully:', paymentIntent.id);

        return res.status(200).json(
            new ApiResponse(
                200,
                "Payment intent created",
                { clientSecret: paymentIntent.client_secret }
            )
        );
    } catch (error) {
        console.error('❌ Payment intent creation failed:', error);
        console.error('Full error:', error);
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Payment processing failed"
        );
    }
});

const handleStripeWebhook = asyncHandler(async (req, res) => {
    const payload = req.rawBody || req.body;
    console.log('🎯 Webhook received:', {
        type: req.body?.type,
        eventId: req.body?.id,
        paymentIntentId: req.body?.data?.object?.payment_intent || req.body?.data?.object?.id
    });

    try {
        const event = req.body;
        
        // Handle both payment_intent.succeeded and charge.succeeded events
        if (event.type === 'payment_intent.succeeded' || event.type === 'charge.succeeded') {
            const paymentIntent = event.type === 'charge.succeeded' 
                ? await stripe.paymentIntents.retrieve(event.data.object.payment_intent)
                : event.data.object;

            console.log('💳 Full payment intent:', JSON.stringify(paymentIntent, null, 2));
            
            if (!paymentIntent.metadata?.walletId) {
                console.error('❌ No walletId in metadata:', paymentIntent.metadata);
                return res.json({ error: 'Missing walletId in metadata' });
            }

            try {
                // First check if wallet exists
                const wallet = await Wallet.findOne({ id: paymentIntent.metadata.walletId });
                if (!wallet) {
                    console.error('❌ Wallet not found:', paymentIntent.metadata.walletId);
                    return res.json({ error: 'Wallet not found' });
                }

                console.log('💰 Processing payment:', {
                    id: paymentIntent.id,
                    walletId: paymentIntent.metadata.walletId,
                    amount: paymentIntent.amount
                });

                const updatedWallet = await Wallet.findOneAndUpdate(
                    { id: paymentIntent.metadata.walletId },
                    { 
                        $inc: { balance: paymentIntent.amount / 100 },
                        $set: { updated_at: new Date() }
                    },
                    { new: true }
                );

                await Wallet.recordTransaction(
                    paymentIntent.metadata.walletId,
                    'deposit',
                    paymentIntent.amount / 100,
                    {
                        source: 'stripe',
                        payment_intent_id: paymentIntent.id
                    }
                );

                console.log('✅ Wallet updated:', updatedWallet);
                return res.json({ received: true });
            } catch (updateError) {
                console.error('❌ Wallet update failed:', updateError);
                return res.json({ error: updateError.message });
            }
        }

        return res.json({ received: true });
    } catch (err) {
        console.error('❌ Webhook processing error:', err);
        return res.json({ error: err.message });
    }
});

export const paymentController = {
    createPaymentIntent,
    handleStripeWebhook
}; 