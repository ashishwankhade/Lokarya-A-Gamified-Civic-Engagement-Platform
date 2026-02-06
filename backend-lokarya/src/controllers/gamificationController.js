import asyncHandler from '../utils/asyncHandler.js';
import gamificationService from '../services/gamificationService.js';
import User from '../models/User.js';

// @desc    Redeem a reward from the store
// @route   POST /api/gamification/redeem
// @access  Private
const redeemReward = asyncHandler(async (req, res) => {
  const { cost, name } = req.body;

  if (!cost || !name) {
    res.status(400);
    throw new Error('Reward details (cost and name) are required.');
  }

  // Use the service method to handle point deduction and history logging
  const result = await gamificationService.redeemPoints(
    req.user._id, 
    cost, 
    name
  );

  res.status(200).json({
    success: true,
    message: `Successfully redeemed ${name}!`,
    newBalance: result.newBalance
  });
});

// @desc    Get top users based on total lifetime contribution
// @route   GET /api/gamification/leaderboard
// @access  Public/Private
const getLeaderboard = asyncHandler(async (req, res) => {
  // We sort by lifetimePoints so that spending points doesn't affect rank
  const topUsers = await User.find({})
    .select('name avatar lifetimePoints currentLevel level')
    .sort({ lifetimePoints: -1 }) // Highest contribution first
    .limit(10);
    
  res.json(topUsers);
});

export { redeemReward, getLeaderboard };