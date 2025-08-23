# ShopSmart Backend Server

A comprehensive Node.js/Express backend for the ShopSmart e-commerce platform with payment integration, order management, and user authentication.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Profile management
  - Admin role support

- **Product Management**
  - Product CRUD operations
  - Image upload with Cloudinary
  - Product search and filtering
  - Category management

- **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Cart persistence
  - Price calculations

- **Order Management**
  - Order creation and tracking
  - Order status updates
  - Order history
  - Order cancellation

- **Payment Integration**
  - Razorpay payment gateway
  - Payment verification
  - Secure transaction processing
  - Payment status tracking

- **Address Management**
  - Multiple shipping addresses
  - Address CRUD operations
  - Default address setting

- **Admin Features**
  - Order management
  - User management
  - Revenue tracking
  - Order statistics

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Payment:** Razorpay
- **File Upload:** Cloudinary
- **Email:** Nodemailer/Resend
- **CORS:** Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Razorpay account
- Cloudinary account (optional)
- Email service (optional)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd shopsmart/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the server root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/shopsmart
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt_token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Search Products
```http
POST /api/products/search
Content-Type: application/json

{
  "query": "search term"
}
```

### Cart Endpoints

#### Get User Cart
```http
GET /api/cart
Authorization: Bearer <jwt_token>
```

#### Add Item to Cart
```http
POST /api/cart
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/:itemId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart
```http
DELETE /api/cart/:itemId
Authorization: Bearer <jwt_token>
```

### Order Endpoints

#### Create Order
```http
POST /api/order/createorder
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "addressId": "address_id",
  "paymentMethod": "razorpay"
}
```

#### Get User Orders
```http
GET /api/order/myorders
Authorization: Bearer <jwt_token>
```

#### Get Order Details
```http
GET /api/order/order/:id
Authorization: Bearer <jwt_token>
```

#### Cancel Order
```http
PUT /api/order/cancel/:id
Authorization: Bearer <jwt_token>
```

#### Verify Payment
```http
POST /api/order/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature",
  "orderId": "order_id"
}
```

### Address Endpoints

#### Get User Addresses
```http
GET /api/address
Authorization: Bearer <jwt_token>
```

#### Add New Address
```http
POST /api/address
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "phone": "1234567890",
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true
}
```

### Admin Endpoints

#### Get All Orders (Admin)
```http
GET /api/order/getallorders
Authorization: Bearer <jwt_token>
```

#### Update Order Status (Admin)
```http
PUT /api/order/:id/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "shipped"
}
```

#### Get Order Count
```http
GET /api/order/ordercount
```

#### Get Total Revenue
```http
GET /api/order/totalrevenue
```

## 🔐 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** Bcrypt password encryption
- **CORS Protection:** Configured for specific domains
- **Input Validation:** Request data validation
- **Payment Verification:** Razorpay signature verification
- **Error Handling:** Comprehensive error management

## 💳 Payment Integration

The backend integrates with Razorpay for secure payment processing:

1. **Order Creation:** Creates order in database and Razorpay
2. **Payment Processing:** Frontend handles Razorpay checkout
3. **Payment Verification:** Verifies payment signature
4. **Order Update:** Updates order status after successful payment

### Payment Flow:
```
User → Add to Cart → Checkout → Create Order → Razorpay Payment → Verify Payment → Order Confirmation
```

## 📊 Database Schema

### User Model
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `phone`: String
- `isAdmin`: Boolean
- `createdAt`: Date
- `updatedAt`: Date

### Product Model
- `_id`: ObjectId
- `name`: String
- `description`: String
- `price`: Number
- `images`: Array of Cloudinary URLs
- `category`: String
- `stock`: Number
- `createdAt`: Date
- `updatedAt`: Date

### Order Model
- `_id`: ObjectId
- `user`: ObjectId (ref: User)
- `orderItems`: Array of order items
- `shippingAddress`: Object
- `paymentMethod`: String
- `paymentResult`: Object
- `itemsPrice`: Number
- `taxPrice`: Number
- `shippingPrice`: Number
- `totalPrice`: Number
- `status`: String (pending, processing, shipped, delivered, cancelled)
- `isPaid`: Boolean
- `paidAt`: Date
- `isDelivered`: Boolean
- `deliveredAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopsmart
JWT_SECRET=your_secure_jwt_secret
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret_key
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Platforms
- **Vercel:** Serverless deployment
- **Heroku:** Traditional hosting
- **AWS:** EC2 or Lambda
- **DigitalOcean:** Droplet deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

Stay updated with the latest changes:
- Follow the repository
- Check the changelog
- Review release notes
