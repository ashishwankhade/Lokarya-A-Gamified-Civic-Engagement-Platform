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
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const user = req.user;
      const crypto = await import('crypto');

      // Generate a short-lived one-time token (valid 60 seconds)
      const onetimeToken = crypto.default.randomBytes(20).toString('hex');
      user.oauthToken        = onetimeToken;
      user.oauthTokenExpiry  = new Date(Date.now() + 60 * 1000);
      await user.save({ validateBeforeSave: false });

      // Redirect frontend with token in URL — no cookies here
      res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${onetimeToken}`);
    } catch (err) {
      console.error('[OAuth] callback error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

router.post('/oauth-exchange', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const User = (await import('../models/User.js')).default;

    const user = await User.findOne({
      oauthToken:       token,
      oauthTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OAuth token' });
    }

    // Clear one-time token
    user.oauthToken        = undefined;
    user.oauthTokenExpiry  = undefined;

    // Store refresh token
    const crypto           = await import('crypto');
    const plainRefreshToken = crypto.default.randomBytes(40).toString('hex');
    await user.setRefreshToken(plainRefreshToken);
    await user.save({ validateBeforeSave: false });

    // Set cookies — this works because it's a direct API call not a redirect
    res.cookie('token', jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' }), {
      expires:  new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      secure:   true,
      sameSite: 'none',
    });

    res.cookie('refreshToken', plainRefreshToken, {
      expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure:   true,
      sameSite: 'none',
      path:     '/api/auth/refresh',
    });

    user.password = undefined;

    res.status(200).json({
      success:      true,
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      avatar:       user.avatar       || '',
      location:     user.location     || '',
      isVerified:   user.isVerified,
      xp:           user.xp           || 0,
      level:        user.level        || 1,
      currentLevel: user.currentLevel || 'Civic Scout',
      totalPoints:  user.totalPoints  || 0,
      nextLevelXP:  user.nextLevelXP  || 200,
    });

  } catch (err) {
    console.error('[OAuth] exchange error:', err);
    res.status(500).json({ success: false, message: 'OAuth exchange failed' });
  }
});

export default router;
