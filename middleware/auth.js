import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const isAuthenticated = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        // console.log(req.headers.authorization.startsWith('Bearer ') )
        let token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
        console.log("Token received:", token);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized access, please login" });
        }
        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS512'] }
        );
        console.log("Decoded token:", decoded);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token, please login again" });
        }
        // Find user by ID
        req.userId = decoded.id;
        next()
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default isAuthenticated;

