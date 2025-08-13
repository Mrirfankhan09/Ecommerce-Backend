import User from '../models/User.js';

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.role === 'admin') {
      console.log('in role')
      next();
    } else {
      res.status(403).json({ message: 'Only admins can perform this action' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export default isAdmin;