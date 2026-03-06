import express from 'express';
import passport from 'passport'; 
import jwt from 'jsonwebtoken';  
import { registerUser, loginUser, logoutUser, getUserProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser); // <--- New Logout Route

// --- Google OAuth ---

// 1. Trigger Google Login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Google Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // This runs if authentication is successful
    const user = req.user;

    // Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Set Cookie manually here for OAuth
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.cookie('token', token, cookieOptions);

    // Redirect to Frontend (Token is now safely in the cookie)
    res.redirect('http://localhost:5173'); 
  }
);

router.route('/profile')
  .get(protect, getUserProfile) 
  .put(protect, upload.single('avatar'), updateProfile);

export default router;