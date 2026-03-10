/**
 * Badge.js
 * Master list of all badges in the system.
 * Path: backend-lokarya/src/models/Badge.js
 *
 * trigger types:
 *   xp_milestone   — awarded when user.xp reaches threshold
 *   action_count   — awarded when XpLedger count for an action reaches threshold
 *   special        — awarded manually via badgeService (login, profile_complete, streak)
 */

import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    // Unique machine key — used by badgeService to reference this badge
    key: { type: String, required: true, unique: true, trim: true },

    // Display
    name:        { type: String, required: true },
    description: { type: String, required: true },
    icon:        { type: String, required: true }, // emoji
    color:       { type: String, default: '#F47C20' },
    category: {
      type: String,
      enum: ['xp_milestone', 'action_count', 'streak', 'special'],
      required: true,
    },

    // Auto-award config
    trigger: {
      type:      { type: String, enum: ['xp_milestone', 'action_count', 'special'] },
      action:    { type: String },   // XpLedger action key e.g. 'file_complaint'
      threshold: { type: Number },   // XP amount OR action count
    },

    // Display order in profile
    sortOrder: { type: Number, default: 0 },
    enabled:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

badgeSchema.index({ key: 1 }, { unique: true });
badgeSchema.index({ category: 1 });

const Badge = mongoose.model('Badge', badgeSchema);

// ── ALL BADGE DEFINITIONS ─────────────────────────────────────────────────────
export const DEFAULT_BADGES = [

  // ── XP MILESTONES ──────────────────────────────────────────────────────────
  {
    key: 'xp_200', name: 'Urban Guardian',
    description: 'Reached 200 XP — promoted to Urban Guardian.',
    icon: '⭐', color: '#2563eb', category: 'xp_milestone',
    trigger: { type: 'xp_milestone', threshold: 200 }, sortOrder: 10,
  },
  {
    key: 'xp_500', name: 'Impact Maker',
    description: 'Reached 500 XP — you\'re making a real difference.',
    icon: '⚡', color: '#059669', category: 'xp_milestone',
    trigger: { type: 'xp_milestone', threshold: 500 }, sortOrder: 11,
  },
  {
    key: 'xp_1000', name: 'City Champion',
    description: 'Reached 1000 XP — a true champion of the city.',
    icon: '🏆', color: '#7c3aed', category: 'xp_milestone',
    trigger: { type: 'xp_milestone', threshold: 1000 }, sortOrder: 12,
  },
  {
    key: 'xp_2000', name: 'Lokarya Legend',
    description: 'Reached 2000 XP — the highest rank in Lokarya.',
    icon: '👑', color: '#d97706', category: 'xp_milestone',
    trigger: { type: 'xp_milestone', threshold: 2000 }, sortOrder: 13,
  },

  // ── ACTION COUNTS ──────────────────────────────────────────────────────────
  {
    key: 'first_complaint', name: 'First Reporter',
    description: 'Filed your very first complaint.',
    icon: '📢', color: '#F47C20', category: 'action_count',
    trigger: { type: 'action_count', action: 'file_complaint', threshold: 1 }, sortOrder: 20,
  },
  {
    key: 'complaints_5', name: 'Persistent Voice',
    description: 'Filed 5 complaints — keeping authorities accountable.',
    icon: '📣', color: '#F47C20', category: 'action_count',
    trigger: { type: 'action_count', action: 'file_complaint', threshold: 5 }, sortOrder: 21,
  },
  {
    key: 'complaints_10', name: 'Civic Watchdog',
    description: 'Filed 10 complaints — a true watchdog of the city.',
    icon: '🔍', color: '#dc2626', category: 'action_count',
    trigger: { type: 'action_count', action: 'file_complaint', threshold: 10 }, sortOrder: 22,
  },
  {
    key: 'first_mission', name: 'First Volunteer',
    description: 'Attended your first NGO mission.',
    icon: '🤝', color: '#2563eb', category: 'action_count',
    trigger: { type: 'action_count', action: 'attend_ngo_activity', threshold: 1 }, sortOrder: 23,
  },
  {
    key: 'missions_5', name: 'Mission Regular',
    description: 'Attended 5 NGO missions.',
    icon: '🎯', color: '#2563eb', category: 'action_count',
    trigger: { type: 'action_count', action: 'attend_ngo_activity', threshold: 5 }, sortOrder: 24,
  },
  {
    key: 'missions_10', name: 'Mission Elite',
    description: 'Attended 10 NGO missions — a community cornerstone.',
    icon: '🛡️', color: '#7c3aed', category: 'action_count',
    trigger: { type: 'action_count', action: 'attend_ngo_activity', threshold: 10 }, sortOrder: 25,
  },
  {
    key: 'complaint_resolved', name: 'Problem Solver',
    description: 'Got your first complaint resolved.',
    icon: '✅', color: '#059669', category: 'action_count',
    trigger: { type: 'action_count', action: 'complaint_resolved', threshold: 1 }, sortOrder: 26,
  },
  {
    key: 'resolved_5', name: 'Change Maker',
    description: 'Got 5 complaints resolved.',
    icon: '🌟', color: '#059669', category: 'action_count',
    trigger: { type: 'action_count', action: 'complaint_resolved', threshold: 5 }, sortOrder: 27,
  },

  // ── STREAK ─────────────────────────────────────────────────────────────────
  {
    key: 'streak_7', name: '7-Day Streak',
    description: 'Active for 7 days in a row.',
    icon: '🔥', color: '#dc2626', category: 'streak',
    trigger: { type: 'special' }, sortOrder: 30,
  },

  // ── SPECIAL ────────────────────────────────────────────────────────────────
  {
    key: 'first_login', name: 'Welcome Aboard',
    description: 'Joined the Lokarya community.',
    icon: '🏳️', color: '#64748b', category: 'special',
    trigger: { type: 'special' }, sortOrder: 40,
  },
  {
    key: 'profile_complete', name: 'Identity Set',
    description: 'Completed your profile with name, location and avatar.',
    icon: '👤', color: '#0f2c4a', category: 'special',
    trigger: { type: 'special' }, sortOrder: 41,
  },
];

/**
 * seedBadges — call once on server startup.
 * Only inserts if collection is empty. Never overwrites.
 */
export const seedBadges = async () => {
  const count = await Badge.countDocuments();
  if (count === 0) {
    await Badge.insertMany(DEFAULT_BADGES);
    console.log(`[Badge Engine] Seeded ${DEFAULT_BADGES.length} badges.`);
  }
};

export default Badge;
