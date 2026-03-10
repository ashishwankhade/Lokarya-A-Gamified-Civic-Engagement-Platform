/**
 * gamificationController.js
 * Path: backend-lokarya/src/controllers/gamificationController.js
 *
 * ── ROUTES ────────────────────────────────────────────────────
 *  POST /api/gamification/redeem       → redeemReward   (private)
 *  GET  /api/gamification/leaderboard  → getLeaderboard (public)
 *  GET  /api/gamification/history      → getXpHistory   (private)
 * ─────────────────────────────────────────────────────────────
 *
 * NOTE: Old gamificationService.js (totalPoints / lifetimePoints) is deleted.
 *       All XP logic now lives in xpEngineService.js + XpLedger.js.
 */

import asyncHandler from '../utils/asyncHandler.js';
import User         from '../models/User.js';
import XpLedger     from '../models/XpLedger.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Redeem a reward — deducts XP from user.xp, logs to XpLedger
// @route   POST /api/gamification/redeem
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const redeemReward = asyncHandler(async (req, res) => {
  const { cost, name } = req.body;

  if (!cost || !name) {
    res.status(400);
    throw new Error('Reward details (cost and name) are required.');
  }

  const numericCost = Number(cost);
  if (isNaN(numericCost) || numericCost <= 0) {
    res.status(400);
    throw new Error('Cost must be a positive number.');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  if ((user.xp || 0) < numericCost) {
    res.status(400);
    throw new Error('Insufficient XP balance.');
  }

  // Deduct from user.xp
  user.xp -= numericCost;
  await user.save();

  // Log to XpLedger as a negative entry (spend)
  await XpLedger.create({
    user:    req.user._id,
    action:  'redeem_reward',
    xp:      -numericCost,           // negative = spend
    balance: user.xp,
    meta:    { note: `Redeemed: ${name}` },
  });

  res.status(200).json({
    success:    true,
    message:    `Successfully redeemed ${name}!`,
    newBalance: user.xp,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Top users sorted by XP (spending doesn't affect rank since
//          rank is derived from user.xp which IS reduced on redeem —
//          if you want rank to be immutable, switch sort to lifetimeXp).
// @route   GET /api/gamification/leaderboard
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find({ banned: { $ne: true } })
    .select('name avatar xp role')
    .sort({ xp: -1 })
    .limit(10);

  res.json(topUsers);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Current user's XP transaction history from XpLedger
// @route   GET /api/gamification/history
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getXpHistory = asyncHandler(async (req, res) => {
  const history = await XpLedger.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(history);
});
