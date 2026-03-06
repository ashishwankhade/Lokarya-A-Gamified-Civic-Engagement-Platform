import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js'; 
import User from '../models/User.js';

// 1. Protect Routes (Check if User is Logged In)
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // PRIORITY 1: Check Cookies (Secure Method)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // PRIORITY 2: Check Authorization Header (Bearer Token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// 2. Role-Based Access Control
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