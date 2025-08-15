import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import { ok } from 'assert';
// import Address from '../models/Address.js';


// Register a new user with OTPOTP
export const registerUser = async (req, res) => {
  console.log(req.body)
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpires,
    isVerified: false,
  });

  await sendEmail({
    to: email,
    subject: 'Verify Your Account - ShopSmart',
    text: `Hi ${name},

Thank you for registering with ShopSmart!

Here’s your One-Time Password (OTP) to verify your account:
${otp}

This OTP will expire in 10 minutes.

If you did not sign up for ShopSmart, please ignore this email.

Regards,
ShopSmart Team
`,
  });


  res.status(201).json({ message: 'OTP sent to email for verification', success: ok });
};

// Verify OTP
export const verifyUserOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.status(200).json({ message: 'Account verified successfully', success: true });
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill all the fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // console.log('pvt key:', process.env.JWT_SECRET);

    const token = jwt.sign(
      { id: user._id }, // payload
      process.env.JWT_SECRET, // secret
      { algorithm: 'HS512', expiresIn: '1d' }
    );
    console.log('Token generated:', token);

    return res
      .status(200)
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
  } catch (error) {
    return res.status(500).json({ message: 'Server error here', error: error.message });
  }
};

// Logout User
export const logoutUser = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie('token', '', {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 0,
      })
      .json({ message: 'User logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    // console.log(token)
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};