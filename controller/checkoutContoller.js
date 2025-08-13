export const checkout = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;
        const userId = req.userId;

        const cart = await Cart.findOne({ user: userId });
        const address = await Address.findById(addressId);

        if (!cart || cart.cartItems.length === 0) {
            return res.status(404).json({ message: "Cart not found or empty" });
        }

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (address.user.toString() !== userId) {
            return res.status(401).json({ message: "Unauthorized access to address" });
        }

        let itemsPrice = 0;
        cart.cartItems.forEach(item => {
            itemsPrice += item.price * item.quantity;
        });

        const taxPrice = Math.round(itemsPrice * 0.05);
        const shippingPrice = itemsPrice > 1000 ? 0 : 50;
        const totalPrice = itemsPrice + taxPrice + shippingPrice;

        const summary = {
            cartItems: cart.cartItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                street: address.street,
                city: address.city,
                state: address.state,
                zip: address.zip,
                country: address.country
            },
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice
        };

        res.status(200).json(summary);

    } catch (error) {
        console.error("Error in checkout:", error);
        res.status(500).json({ message: "Server error" });
    }
};
