import express from 'express';
import passport from 'passport'; // Import passport
import jwt from 'jsonwebtoken';  // Import jwt to generate token manually
import { registerUser, loginUser, getUserProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
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

    // Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Redirect to Frontend with Token
    // Change this URL to your actual frontend port (e.g., localhost:5173)
    res.redirect(`http://localhost:5173?token=${token}`);
  }
);

router.route('/profile')
  .get(protect, getUserProfile) // Your existing GET
  .put(protect, upload.single('avatar'), updateProfile);

export default router;