import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity } = req.body;
    console.log("Adding to cart:", { userId, productId, quantity });

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID and valid quantity are required." 
      });
    }

    // Check if product exists and has sufficient stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found." 
      });
    }

    console.log("Product found:", { 
      id: product._id, 
      name: product.name, 
      stock: product.stock, 
      price: product.price 
    });

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false,
        message: `Only ${product.stock} items available in stock.` 
      });
    }

    // Find existing cart
    let cart = await Cart.findOne({ user: userId });
    console.log("Existing cart:", cart ? "Found" : "Not found");

    if (!cart) {
      // Create new cart
      cart = new Cart({
        user: userId,
        cartItems: [
          {
            product: product._id,
            name: product.name,
            quantity,
            price: product.price,
            image: product.images,
          },
        ],
      });
      console.log("Created new cart");
    } else {
      // Check if product already exists in cart
      const itemIndex = cart.cartItems.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists → check if new total quantity exceeds stock
        const newQuantity = cart.cartItems[itemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          return res.status(400).json({ 
            success: false,
            message: `Cannot add ${quantity} more items. Only ${product.stock - cart.cartItems[itemIndex].quantity} more items available.` 
          });
        }
        cart.cartItems[itemIndex].quantity = newQuantity;
        console.log("Updated existing item quantity");
      } else {
        // Add new item
        cart.cartItems.push({
          product: product._id,
          name: product.name,
          quantity,
          price: product.price,
          image: product.images,
        });
        console.log("Added new item to cart");
      }
    }

    // Recalculate totals
    cart.totalItems = cart.cartItems.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.cartItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    console.log("Cart totals:", { 
      totalItems: cart.totalItems, 
      totalPrice: cart.totalPrice 
    });

    await cart.save();
    console.log("Cart saved successfully");

    // Populate product details for response
    const populatedCart = await Cart.findOne({ user: userId }).populate('cartItems.product');

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Getting cart for user:", userId);

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');

    if (!cart || cart.cartItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Your cart is empty",
        cart: {
          cartItems: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    console.log("Cart found with items:", cart.cartItems.length);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    console.log("Updating cart item:", { userId, itemId, quantity });

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.cartItems.id(itemId);

    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

    // Check stock availability before updating
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ 
        success: false,
        message: `Only ${product.stock} items available in stock.` 
      });
    }

    item.quantity = quantity;

    // Recalculate totals
    cart.totalItems = cart.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

    await cart.save();

    // Populate product details for response
    const updatedCart = await Cart.findOne({ user: userId }).populate('cartItems.product');

    res.status(200).json({ 
      success: true,
      message: "Cart item updated", 
      cart: updatedCart 
    });
  } catch (err) {
    console.error("Error in updateCartItem:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;

    console.log("Removing cart item:", { userId, itemId });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const initialLength = cart.cartItems.length;

    cart.cartItems = cart.cartItems.filter(item => item._id.toString() !== itemId);

    if (cart.cartItems.length === initialLength) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    // Recalculate totals
    cart.totalItems = cart.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

    await cart.save();

    // Populate product details for response
    const updatedCart = await Cart.findOne({ user: userId }).populate('cartItems.product');

    res.status(200).json({ 
      success: true,
      message: "Item removed from cart", 
      cart: updatedCart 
    });
  } catch (err) {
    console.error("Error in removeCartItem:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Clearing cart for user:", userId);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.cartItems = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({ 
      success: true,
      message: "Cart cleared successfully", 
      cart: {
        cartItems: [],
        totalItems: 0,
        totalPrice: 0,
      }
    });
  } catch (err) {
    console.error("Error in clearCart:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

