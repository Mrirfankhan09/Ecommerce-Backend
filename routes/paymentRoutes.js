import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
} from '../controller/orderControler.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payment routes are working',
    timestamp: new Date().toISOString()
  });
});

// Payment routes
router.post('/create', createPaymentOrder); // Create Razorpay order
router.post('/verify', auth, verifyPayment); // Verify payment

export default router;
