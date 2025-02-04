import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";

// Create a router for healthcheck routes.
const router = Router();

// Define a route for healthcheck.
router.route("/").get(healthcheck);

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;