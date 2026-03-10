/**
 * xpEngineService.js  (updated — now calls badgeService after every award)
 * Path: backend-lokarya/src/services/xpEngineService.js
 */

import XpRule   from '../models/XpRule.js';
import XpLedger from '../models/XpLedger.js';
import User     from '../models/User.js';
import { checkAndAwardBadges } from './badgeService.js'; // ← ADDED

const TIERS = [
  { level: 1, name: 'Civic Scout',    minXp: 0    },
  { level: 2, name: 'Urban Guardian', minXp: 200  },
  { level: 3, name: 'Impact Maker',   minXp: 500  },
  { level: 4, name: 'City Champion',  minXp: 1000 },
  { level: 5, name: 'Lokarya Legend', minXp: 2000 },
];

const getTier = (xp) =>
  [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0];

let _ruleCache = null;
let _cacheTime = 0;

const getRules = async () => {
  if (_ruleCache && Date.now() - _cacheTime < 60000) return _ruleCache;
  _ruleCache = await XpRule.find({ enabled: true }).lean();
  _cacheTime  = Date.now();
  return _ruleCache;
};

export const bustRuleCache = () => { _ruleCache = null; };

/**
 * awardXp
 * Now returns newBadges[] in addition to existing fields.
 * Controllers can pass these to the frontend so toast notifications fire.
 */
export const awardXp = async (userId, action, meta = {}, override = null) => {
  const rules = await getRules();
  const rule  = rules.find(r => r.action === action);

  if (!rule) return { awarded: false, reason: `Rule "${action}" disabled or not found.` };

  const xpAmount = override !== null ? Number(override) : rule.xp;

  if (xpAmount === 0 && action !== 'admin_manual_award') {
    return { awarded: false, reason: 'XP amount is 0.' };
  }

  // Cooldown check
  if (rule.cooldownHrs > 0) {
    const since  = new Date(Date.now() - rule.cooldownHrs * 3600000);
    const recent = await XpLedger.findOne({ user: userId, action, createdAt: { $gte: since } });
    if (recent) return { awarded: false, reason: `Cooldown active for "${rule.label}". Try later.` };
  }

  // Daily cap check
  if (rule.maxPerDay > 0) {
    const sod      = new Date(); sod.setHours(0, 0, 0, 0);
    const dayCount = await XpLedger.countDocuments({ user: userId, action, createdAt: { $gte: sod } });
    if (dayCount >= rule.maxPerDay) {
      return { awarded: false, reason: `Daily limit reached for "${rule.label}".` };
    }
  }

  const user = await User.findById(userId);
  if (!user) return { awarded: false, reason: 'User not found.' };

  const prevXp   = user.xp || 0;
  const newXp    = prevXp + xpAmount;
  const prevTier = getTier(prevXp);
  const newTier  = getTier(newXp);

  user.xp = newXp;
  await user.save();

  await XpLedger.create({
    user:    userId,
    action,
    xp:      xpAmount,
    balance: newXp,
    meta,
  });

  // ── BADGE CHECK (new) ────────────────────────────────────────────────────
  // Run after ledger is written so action_count queries see the new entry.
  let newBadges = [];
  try {
    newBadges = await checkAndAwardBadges(userId, { newXp, action });
  } catch (badgeErr) {
    // Badge errors must never break XP award — log and continue
    console.error('[Badge Engine] Error during badge check:', badgeErr.message);
  }

  return {
    awarded:      true,
    xp:           xpAmount,
    newTotal:     newXp,
    leveledUp:    newTier.level > prevTier.level,
    currentLevel: newTier.name,
    prevLevel:    prevTier.name,
    rule:         rule.label,
    newBadges,           // ← ADDED — array of { key, name, icon }
  };
};

export const getUserXpSummary = async (userId) => {
  const user  = await User.findById(userId).select('xp name');
  if (!user)  return null;

  const xp    = user.xp || 0;
  const tier  = getTier(xp);
  const next  = TIERS.find(t => t.minXp > xp);
  const history = await XpLedger.find({ user: userId }).sort({ createdAt: -1 }).limit(20);

  return {
    xp,
    tier:         tier.name,
    tierLevel:    tier.level,
    nextTier:     next?.name || null,
    xpToNextTier: next ? next.minXp - xp : 0,
    recentHistory: history,
    tiers: TIERS,
  };
};
