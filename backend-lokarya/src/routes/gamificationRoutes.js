import express from 'express';
const router = express.Router();
import { redeemReward, getLeaderboard } from '../controllers/gamificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

// Protect ensures only logged-in users can redeem
router.post('/redeem', protect, redeemReward);
router.get('/leaderboard', getLeaderboard);

export default router;