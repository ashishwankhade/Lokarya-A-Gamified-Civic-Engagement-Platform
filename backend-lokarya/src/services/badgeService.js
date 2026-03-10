/**
 * badgeService.js
 * Central badge-award engine. Called by:
 *   - xpEngineService  (after every XP award)
 *   - authController   (on register → first_login)
 *   - authController   (on updateProfile → profile_complete)
 *
 * Path: backend-lokarya/src/services/badgeService.js
 *
 * Usage:
 *   import { checkAndAwardBadges, awardSpecialBadge } from '../services/badgeService.js';
 *
 *   // After awarding XP:
 *   const newBadges = await checkAndAwardBadges(userId, { newXp: 250, action: 'file_complaint' });
 *
 *   // For special triggers:
 *   const badge = await awardSpecialBadge(userId, 'first_login');
 */

import Badge     from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import XpLedger  from '../models/XpLedger.js';

// ── Badge cache (same pattern as xpEngineService rule cache) ─────────────────
let _badgeCache = null;
let _cacheTime  = 0;

const getBadges = async () => {
  if (_badgeCache && Date.now() - _cacheTime < 300000) return _badgeCache; // 5 min TTL
  _badgeCache = await Badge.find({ enabled: true }).lean();
  _cacheTime  = Date.now();
  return _badgeCache;
};

export const bustBadgeCache = () => { _badgeCache = null; };

// ── Helper: get set of badge keys already owned by user ──────────────────────
const getOwnedKeys = async (userId) => {
  const owned = await UserBadge.find({ user: userId }).select('key').lean();
  return new Set(owned.map(b => b.key));
};

// ── Helper: award a single badge (idempotent — safe to call twice) ────────────
const awardBadge = async (userId, badge, triggerStr) => {
  try {
    await UserBadge.create({
      user:    userId,
      badge:   badge._id,
      key:     badge.key,
      trigger: triggerStr,
    });
    return { key: badge.key, name: badge.name, icon: badge.icon };
  } catch (err) {
    // Duplicate key = already awarded, not an error
    if (err.code === 11000) return null;
    throw err;
  }
};

/**
 * checkAndAwardBadges
 * Called after every XP award. Checks all auto-trigger badges.
 *
 * @param {string|ObjectId} userId
 * @param {object} context  — { newXp, action }
 * @returns {Array}  newly awarded badges  (empty if none)
 */
export const checkAndAwardBadges = async (userId, { newXp = 0, action = '' } = {}) => {
  const [allBadges, ownedKeys] = await Promise.all([
    getBadges(),
    getOwnedKeys(userId),
  ]);

  const newlyAwarded = [];

  for (const badge of allBadges) {
    // Skip already owned
    if (ownedKeys.has(badge.key)) continue;

    const { type, threshold, action: triggerAction } = badge.trigger || {};

    // ── XP milestone ───────────────────────────────────────────────────────
    if (type === 'xp_milestone' && threshold) {
      if (newXp >= threshold) {
        const awarded = await awardBadge(userId, badge, `xp_milestone:${threshold}`);
        if (awarded) newlyAwarded.push(awarded);
      }
    }

    // ── Action count ───────────────────────────────────────────────────────
    if (type === 'action_count' && triggerAction && threshold) {
      // Only run this check if current action matches the badge's trigger action
      // — avoids unnecessary DB queries on unrelated actions
      if (action === triggerAction) {
        const count = await XpLedger.countDocuments({ user: userId, action: triggerAction });
        if (count >= threshold) {
          const awarded = await awardBadge(userId, badge, `action_count:${triggerAction}:${threshold}`);
          if (awarded) newlyAwarded.push(awarded);
        }
      }
    }
  }

  return newlyAwarded;
};

/**
 * awardSpecialBadge
 * For badges that can't be auto-detected from XP/action data:
 *   first_login, profile_complete, streak_7
 *
 * @param {string|ObjectId} userId
 * @param {string}          badgeKey   — must match Badge.key
 * @returns {object|null}   awarded badge or null if already owned / not found
 */
export const awardSpecialBadge = async (userId, badgeKey) => {
  const allBadges  = await getBadges();
  const badge      = allBadges.find(b => b.key === badgeKey);
  if (!badge) return null;

  const ownedKeys = await getOwnedKeys(userId);
  if (ownedKeys.has(badgeKey)) return null; // already owned

  return await awardBadge(userId, badge, `special:${badgeKey}`);
};

/**
 * getUserBadges
 * Returns all badges (all defined + which ones user owns).
 * Used by profile page and admin user detail.
 *
 * @param {string|ObjectId} userId
 * @returns {Array}  [ { key, name, icon, color, category, description, unlocked, earnedAt } ]
 */
export const getUserBadges = async (userId) => {
  const [allBadges, userBadges] = await Promise.all([
    getBadges(),
    UserBadge.find({ user: userId }).lean(),
  ]);

  const earnedMap = new Map(userBadges.map(ub => [ub.key, ub.earnedAt]));

  return allBadges
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(b => ({
      key:         b.key,
      name:        b.name,
      description: b.description,
      icon:        b.icon,
      color:       b.color,
      category:    b.category,
      unlocked:    earnedMap.has(b.key),
      earnedAt:    earnedMap.get(b.key) || null,
    }));
};
