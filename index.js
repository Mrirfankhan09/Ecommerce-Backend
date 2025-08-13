import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import userRoute from './routes/userRoutes.js';
import productRoute from './routes/productRoutes.js';
import cartRoute from './routes/cartRoutes.js';
import addressRoute from './routes/AddressRoutes.js';
import orderRoute from './routes/orderRoutes.js';
import crypto from 'crypto';
dotenv.config();


// Generate a random 32-byte (256-bit) buffer
const secretBuffer = crypto.randomBytes(32);

// Convert the buffer to a hexadecimal string
const secretKey = secretBuffer.toString('hex');

console.log('Generated JWT Secret Key:', secretKey);

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // array of allowed origins
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute)
app.use('/api/address', addressRoute)
app.use('/api/orders', orderRoute);


const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }
};

startServer();
