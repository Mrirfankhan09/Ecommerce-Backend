# ShopSmart Backend Environment Setup

## Required Environment Variables

Create a `.env` file in the server root directory with the following variables:

### Server Configuration
```env
PORT=3000
NODE_ENV=development
```

### Database Configuration
```env
MONGODB_URI=mongodb://localhost:27017/shopsmart
# For production: mongodb+srv://username:password@cluster.mongodb.net/shopsmart
```

### JWT Configuration
```env
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

### Razorpay Configuration (Required for Payments)
```env
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

### Cloudinary Configuration (for image uploads)
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Email Configuration (for order confirmations)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### Resend Configuration (alternative email service)
```env
RESEND_API_KEY=your_resend_api_key
```

### Frontend URLs (for CORS)
```env
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
```

### Payment Success/Failure URLs
```env
PAYMENT_SUCCESS_URL=http://localhost:5173/payment-success
PAYMENT_FAILURE_URL=http://localhost:5173/payment-failure
```

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   - Copy the variables above to a `.env` file
   - Replace placeholder values with your actual credentials

3. **Set up Razorpay:**
   - Sign up at [Razorpay](https://razorpay.com)
   - Get your test API keys from the dashboard
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

4. **Set up Cloudinary (for image uploads):**
   - Sign up at [Cloudinary](https://cloudinary.com)
   - Get your credentials from the dashboard
   - Update the Cloudinary environment variables

5. **Set up Email (optional):**
   - For Gmail: Enable 2FA and generate an app password
   - For Resend: Sign up and get your API key

6. **Start the Server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products/search` - Search products

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove item from cart

### Address
- `GET /api/address` - Get user addresses
- `POST /api/address` - Add new address
- `PUT /api/address/:id` - Update address
- `DELETE /api/address/:id` - Delete address

### Orders
- `GET /api/order/myorders` - Get user orders
- `GET /api/order/order/:id` - Get order details
- `POST /api/order/createorder` - Create order
- `PUT /api/order/cancel/:id` - Cancel order

### Payments
- `POST /api/payment/create` - Create payment order
- `POST /api/order/verify` - Verify payment

### Admin Routes
- `GET /api/order/getallorders` - Get all orders (admin)
- `PUT /api/order/:id/status` - Update order status (admin)
- `GET /api/order/ordercount` - Get order count
- `GET /api/order/totalrevenue` - Get total revenue

## Payment Integration

The backend supports Razorpay payment integration with the following flow:

1. **Create Order:** `POST /api/order/createorder`
   - Creates order in database
   - Creates Razorpay order
   - Returns payment details

2. **Process Payment:** Frontend handles Razorpay payment
   - Uses Razorpay checkout
   - Processes payment securely

3. **Verify Payment:** `POST /api/order/verify`
   - Verifies payment signature
   - Updates order status
   - Marks order as paid

## Security Features

- JWT authentication for all protected routes
- Payment signature verification
- CORS configuration for frontend domains
- Input validation and sanitization
- Error handling and logging

## Production Deployment

For production deployment:

1. Update `NODE_ENV=production`
2. Use production MongoDB URI
3. Use production Razorpay keys
4. Configure proper CORS origins
5. Set up proper logging and monitoring
6. Use HTTPS for all endpoints
7. Implement rate limiting
8. Set up backup and recovery procedures
