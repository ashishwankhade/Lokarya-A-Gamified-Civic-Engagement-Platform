import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// ─── PROTECT ──────────────────────────────────────────────────────────────────
// Verifies the short-lived access token from the HttpOnly cookie.
// If expired, the frontend refresh interceptor will call /auth/refresh
// and retry — so no refresh logic needed here.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Priority 1: HttpOnly cookie (primary method)
  if (req.cookies?.token) {
    token = req.cookies.token;
  }
  // Priority 2: Bearer header (API clients / mobile)
  else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User no longer exists');
    }

    // FIX: also block unverified users from accessing protected routes
    if (!req.user.isVerified) {
      res.status(403);
      throw new Error('Account pending approval');
    }

    next();
  } catch (error) {
    // Distinguish between expired token and genuinely invalid token
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Token expired');
    }
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// ─── AUTHORIZE ────────────────────────────────────────────────────────────────
// Role-based access control — use after protect middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

export { protect, authorize };
