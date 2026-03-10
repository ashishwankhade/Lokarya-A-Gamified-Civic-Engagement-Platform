/**
 * gamificationRoutes.js
 * Path: backend-lokarya/src/routes/gamificationRoutes.js
 */

import express                                        from 'express';
import { redeemReward, getLeaderboard, getXpHistory } from '../controllers/gamificationController.js';
import { protect }                                    from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/redeem',      protect,     redeemReward);   // spend XP
router.get('/leaderboard',               getLeaderboard); // public
router.get('/history',      protect,     getXpHistory);   // XP transaction log

export default router;
