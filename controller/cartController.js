import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity } = req.body;
    console.log(productId,quantity)

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Product ID and valid quantity are required." });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Find existing cart
    let cart = await Cart.findOne({ user: userId });

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
    } else {
      // Check if product already exists in cart
      const itemIndex = cart.cartItems.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists → increase quantity
        cart.cartItems[itemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.cartItems.push({
          product: product._id,
          name: product.name,
          quantity,
          price: product.price,
          image: product.images,
        });
      }
    }

    // Recalculate totals
    cart.totalItems = cart.cartItems.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.cartItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({ message: "Server error" });
  }
};





export const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.cartItems.length === 0) {
      return res.status(200).json({
        message: "Your cart is empty",
        cart: {
          cartItems: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    res.status(200).json({
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.cartItems.id(itemId);

    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = quantity;

    // Recalculate totals
    cart.totalItems = cart.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

    await cart.save();

    res.status(200).json({ message: "Cart item updated", cart });
  } catch (err) {
    console.error("Error in updateCartItem:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const removeCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const initialLength = cart.cartItems.length;

    cart.cartItems = cart.cartItems.filter(item => item._id.toString() !== itemId);

    if (cart.cartItems.length === initialLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Recalculate totals
    cart.totalItems = cart.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error("Error in removeCartItem:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.cartItems = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    console.error("Error in clearCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

