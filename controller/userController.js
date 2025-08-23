import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Address from '../models/Address.js';

// Get Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.userId);
    console.log('Updating user profile:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getallUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export const userCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
}