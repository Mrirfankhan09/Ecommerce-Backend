import express from 'express';
import { createOrder,getMyOrders,
  getOrderById,
  verifyPayment,markAsDelivered, 
  getallOrders,
  orderCount,
  totalrevenue} from '../controller/orderControler.js';
  import isAdmin from '../middleware/isAdmin.js'
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/ordercount',orderCount); // Get order count
router.get('/totalrevenue',totalrevenue);
router.get('/getallorders',getallOrders)
router.post('/', auth, createOrder); // Create order + Razorpay
router.post('/verify', auth, verifyPayment); // Verify payment
router.get('/', auth, getMyOrders); // Get all user orders
router.get('/:id', auth, getOrderById); // Get order details
router.get('/:id',auth,isAdmin,markAsDelivered);
// router.get('/:id/invoice', auth, getInvoice); // PDF invoice

export default router;