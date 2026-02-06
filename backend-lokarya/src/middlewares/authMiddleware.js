import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js'; // Or use your custom '../utils/asyncHandler.js'
import User from '../models/User.js';

// 1. Protect Routes (Check if User is Logged In)
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the ID in the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Move to the next middleware/controller
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// 2. Role-Based Access Control (Check specific roles)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

export { protect, authorize };