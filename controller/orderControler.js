// ✅ Full Order + Payment + Invoice Controllers
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Address from '../models/Address.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
// import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Razorpay Setup
const razorpay = new Razorpay({
  key_id: 'rzp_test_CqbkBvwwlgejeB',
  key_secret: 'rnbnKZiZNMSAEsvH8hDjbCFo',
});

// ✅ Place Order
export const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, amount } = req.body;
    console.log(req.body)
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const address = await Address.findById(addressId);
    if (!address || address.user.toString() !== userId) return res.status(401).json({ message: 'Invalid address' });

    let itemsPrice = 0;
    cart.cartItems.forEach(item => itemsPrice += item.price * item.quantity);

    const taxPrice = Math.round(itemsPrice * 0.05);
    const shippingPrice = itemsPrice > 1000 ? 0 : 50;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;
    console.log(cart.cartItems[0].image[0].url, 'cart items in createOrder');

    // console.log(obj,typeof obj, 'cart items in createOrder image');


    const orderItems = cart.cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      image: item.image[0].url,
      price: item.price,
      product: item.product,
    }));

    const shippingAddress = {
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
    };

    const order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    await Cart.findOneAndDelete({ user: userId });
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get User Orders
export const getMyOrders = async (req, res) => {
  try {
    console.log(req.userId)
    const orders = await Order.find({ user: req.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.user.toString() !== req.userId) return res.status(404).json({ message: 'Not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Razorpay Order
export const createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `rcpt_${Math.floor(Math.random() * 10000)}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Payment order creation failed' });
  }
};

// ✅ Razorpay Payment Verification
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', 'rnbnKZiZNMSAEsvH8hDjbCFo').update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: razorpay_payment_id,
      status: 'Paid',
      update_time: new Date().toISOString(),
      email_address: req.user?.email || '',
    };
    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// ✅ Invoice Generator (PDF)
// export const getInvoice = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order || order.user.toString() !== req.userId) return res.status(401).json({ message: 'Unauthorized' });

//     const doc = new PDFDocument();
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `inline; filename=invoice_${order._id}.pdf`);

//     doc.fontSize(20).text('Invoice', { align: 'center' });
//     doc.moveDown();
//     doc.text(`Order ID: ${order._id}`);
//     doc.text(`Date: ${order.createdAt.toDateString()}`);
//     doc.text(`Payment: ${order.isPaid ? 'Paid' : 'Pending'}`);
//     doc.text(`Total: ₹${order.totalPrice}`);

//     doc.moveDown().text('Shipping Address:');
//     const a = order.shippingAddress;
//     doc.text(`${a.street}, ${a.city}, ${a.state}, ${a.zip}, ${a.country}`);

//     doc.moveDown().text('Items:');
//     order.orderItems.forEach(i => {
//       doc.text(`${i.name} - ₹${i.price} x ${i.quantity}`);
//     });

//     doc.end();
//     doc.pipe(res);
//   } catch (error) {
//     res.status(500).json({ message: 'Could not generate invoice' });
//   }
// };


export const markAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.isDelivered = true;
    order.deliveredAt = new Date();
    await order.save();

    res.status(200).json({ message: 'Order marked as delivered', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update delivery status' });
  }
};

export const getallOrders = async (req, res) => {
  try {
    console.log('Fetching all orders');

    // Populate user details in one query
    const orders = await Order.find()
      .populate('user', 'name') // Only get the name from User
      .sort({ createdAt: -1 }); // Optional: newest first
    console.log(orders, 'all orders');

    const orderdata = orders.map(order => ({
      id: order._id,
      customer: order.user?.name || 'Unknown User',
      total: order.totalPrice,
      status: order.isDelivered
        ? 'Delivered'
        : order.isPaid
          ? 'Paid'
          : 'Pending',
      date: order.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
    }));

    res.status(200).json(orderdata);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


export const orderCount = async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching order count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const totalrevenue = async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true });
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    res.status(200).json({ success: true, totalRevenue });
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}