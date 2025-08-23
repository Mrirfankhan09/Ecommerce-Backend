// ✅ Full Order + Payment + Invoice Controllers
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Address from '../models/Address.js';
import Product from '../models/Product.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
// import PDFDocument from 'pdfkit';

import dotenv from 'dotenv';
dotenv.config();


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// 1️⃣ Create order
export const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const userId = req.userId; // from auth middleware

    // Fetch cart
    const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');
    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate address
    const address = await Address.findById(addressId);
    if (!address || address.user.toString() !== userId) {
      return res.status(401).json({ message: "Invalid address" });
    }

    // Check stock availability for all items before creating order
    for (const item of cart.cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
    }

    // Calculate prices
    let itemsPrice = 0;
    cart.cartItems.forEach((item) => {
      itemsPrice += item.product.price * item.quantity;
    });
    const taxPrice = Math.round(itemsPrice * 0.05);
    const shippingPrice = itemsPrice > 1000 ? 0 : 100;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    // Prepare order items
    const orderItems = cart.cartItems.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      image: item.product.images[0]?.url || '',
      price: item.product.price,
      product: item.product._id,
    }));

    // Shipping details
    const shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country || 'India',
    };

    // Create Razorpay order (for online payment)
    let razorpayOrder;
    if (paymentMethod === "razorpay") {
      razorpayOrder = await razorpay.orders.create({
        amount: totalPrice * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
    }

    // Update product stock - reduce stock for all items
    for (const item of cart.cartItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Save order in DB
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: false,
      status: 'pending'
    });

    // Clear cart
    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder?.id || null,
      amount: razorpayOrder?.amount || totalPrice * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Update order as paid
      await Order.findByIdAndUpdate(orderId, {
        isPaid: true,
        paidAt: new Date(),
        status: 'processing',
        paymentResult: {
          id: razorpay_payment_id,
          status: 'completed',
          update_time: new Date().toISOString(),
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      });

      return res.json({ success: true, message: "Payment verified" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3️⃣ Get user orders
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ user: userId })
      .populate('orderItems.product', 'name images price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id,
        orderItems: order.orderItems,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        itemsPrice: order.itemsPrice,
        taxPrice: order.taxPrice,
        shippingPrice: order.shippingPrice,
        totalPrice: order.totalPrice,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        isDelivered: order.isDelivered,
        deliveredAt: order.deliveredAt,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 4️⃣ Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findById(id)
      .populate('orderItems.product', 'name images price description')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== userId && !req.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderItems: order.orderItems,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        itemsPrice: order.itemsPrice,
        taxPrice: order.taxPrice,
        shippingPrice: order.shippingPrice,
        totalPrice: order.totalPrice,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        isDelivered: order.isDelivered,
        deliveredAt: order.deliveredAt,
        status: order.status,
        paymentResult: order.paymentResult,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 5️⃣ Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.user.toString() !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    // Restore product stock - add back the quantities
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Server error" });
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
    order.status = 'delivered';
    await order.save();

    res.status(200).json({ message: 'Order marked as delivered', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update delivery status' });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order is being cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = status;
    
    // Set deliveredAt if status is delivered
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }
    
    // Set shippedAt if status is shipped
    if (status === 'shipped') {
      order.shippedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
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
      status: order.status || (order.isDelivered
        ? 'Delivered'
        : order.isPaid
          ? 'Paid'
          : 'Pending'),
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