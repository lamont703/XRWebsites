import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { paymentController } from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-intent", verifyJWT, paymentController.createPaymentIntent);
router.post("/webhook", paymentController.handleStripeWebhook);

export default router; 