import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
} from '../controller/orderControler.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Payment routes
router.post('/create', createPaymentOrder); // Create Razorpay order
router.post('/verify', auth, verifyPayment); // Verify payment

export default router;
