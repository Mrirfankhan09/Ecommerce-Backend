import express from 'express';
import {
  createOrder,
  verifyPayment, 
  markAsDelivered,
  getallOrders,
  orderCount,
  totalrevenue,
  createPaymentOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} from '../controller/orderControler.js';
import isAdmin from '../middleware/isAdmin.js'
import auth from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get('/getallorders', auth, isAdmin, getallOrders);
router.get('/ordercount', orderCount); // Get order count
router.get('/totalrevenue', totalrevenue);
router.put('/:id/status', auth, isAdmin, updateOrderStatus); // Update order status
router.get('/:id', auth, isAdmin, markAsDelivered); // Mark as delivered (admin)

// User routes
router.get('/myorders', auth, getMyOrders); // Get user's orders
router.get('/order/:id', auth, getOrderById); // Get specific order details
router.put('/cancel/:id', auth, cancelOrder); // Cancel order

// Payment routes
router.post('/createpayment', createPaymentOrder);
router.post('/createorder', auth, createOrder); // Create order + Razorpay
router.post('/verify', auth, verifyPayment); // Verify payment

export default router;