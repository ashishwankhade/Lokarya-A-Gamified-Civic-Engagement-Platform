import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getMe,
  getUserProfile,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRegister, validateLogin, validateUpdateProfile } from '../middlewares/validateMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────
// FIX: /refresh was completely unprotected — an attacker could hammer it
// to generate unlimited access tokens from a single stolen refresh token.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30, // silent renewal — slightly more lenient
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts. Try again later.' },
});

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/register', authLimiter,    validateRegister, registerUser);
router.post('/login',    authLimiter,    validateLogin,    loginUser);
router.post('/logout',   logoutUser);

// FIX: refresh route now has its own rate limiter
router.post('/refresh',  refreshLimiter, refreshAccessToken);

// ─── Protected ────────────────────────────────────────────────────────────────
router.get('/me', protect, getMe);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('avatar'), validateUpdateProfile, updateProfile);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    const user = req.user;
    const isProd = process.env.NODE_ENV === 'production';

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    // FIX: OAuth login now also stores refresh token in DB (same as regular login)
    const crypto = await import('crypto');
    const plainRefreshToken = crypto.randomBytes(40).toString('hex');
    await user.setRefreshToken(plainRefreshToken);
    await user.save({ validateBeforeSave: false });

    res.cookie('token', accessToken, {
      expires:  new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'strict' : 'lax',
    });

    res.cookie('refreshToken', plainRefreshToken, {
      expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path:     '/api/auth/refresh',
    });

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

export default router;
