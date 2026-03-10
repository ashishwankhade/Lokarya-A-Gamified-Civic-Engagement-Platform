/**
 * XpRule.js
 * Configurable XP rule engine — Super Admin sets rules, system applies them.
 * Path: backend-lokarya/src/models/XpRule.js
 *
 * Each rule defines:
 *  action       → trigger key used by all controllers (e.g. 'file_complaint')
 *  label        → human-readable name shown in admin UI
 *  xp           → points awarded per trigger
 *  enabled      → toggle without deleting
 *  category     → citizen | ngo | system  (for grouping in admin UI)
 *  cooldownHrs  → min hours between awards for same user+action (0 = none)
 *  maxPerDay    → daily cap per user (0 = unlimited)
 */

import mongoose from 'mongoose';

const xpRuleSchema = new mongoose.Schema(
  {
    action: {
      type: String, required: true, unique: true, trim: true,
    },
    label: {
      type: String, required: true, trim: true,
    },
    description: {
      type: String, default: '',
    },
    category: {
      type: String, enum: ['citizen', 'ngo', 'system'], default: 'citizen',
    },
    xp: {
      type: Number, required: true, min: 0, max: 10000,
    },
    enabled: {
      type: Boolean, default: true,
    },
    cooldownHrs: {
      type: Number, default: 0, min: 0,
    },
    maxPerDay: {
      type: Number, default: 0, min: 0,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId, ref: 'User',
    },
  },
  { timestamps: true }
);

xpRuleSchema.index({ action: 1 }, { unique: true });
xpRuleSchema.index({ category: 1 });

const XpRule = mongoose.model('XpRule', xpRuleSchema);

// ── DEFAULT RULES ─────────────────────────────────────────────────────────────
export const DEFAULT_XP_RULES = [
  // CITIZEN
  {
    action: 'file_complaint',        label: 'File a Complaint',
    description: 'Citizen submits a new complaint via the app.',
    category: 'citizen', xp: 10,  cooldownHrs: 1,   maxPerDay: 5,
  },
  {
    action: 'complaint_resolved',    label: 'Complaint Resolved',
    description: 'Citizen\'s complaint is marked resolved by authority.',
    category: 'citizen', xp: 25,  cooldownHrs: 0,   maxPerDay: 0,
  },
  {
    action: 'rate_feedback',         label: 'Rate / Give Feedback',
    description: 'Citizen rates a resolved complaint (1–5 stars).',
    category: 'citizen', xp: 5,   cooldownHrs: 0,   maxPerDay: 10,
  },
  {
    action: 'attend_ngo_activity',   label: 'Attend NGO Activity',
    description: 'Base XP for attending an NGO mission. Activity-level reward overrides this.',
    category: 'citizen', xp: 50,  cooldownHrs: 0,   maxPerDay: 0,
  },
  {
    action: 'verify_duplicate',      label: 'Verify Duplicate Complaint',
    description: 'Citizen flags a complaint as duplicate (community verification).',
    category: 'citizen', xp: 5,   cooldownHrs: 2,   maxPerDay: 10,
  },
  {
    action: 'refer_friend',          label: 'Refer a Friend',
    description: 'Referred friend signs up and files their first complaint.',
    category: 'citizen', xp: 20,  cooldownHrs: 0,   maxPerDay: 5,
  },
  {
    action: 'first_complaint',       label: 'First Complaint Ever',
    description: 'One-time bonus for citizen\'s very first complaint.',
    category: 'citizen', xp: 30,  cooldownHrs: 0,   maxPerDay: 1,
  },
  {
    action: 'streak_7day',           label: '7-Day Activity Streak',
    description: 'Active for 7 consecutive days (any qualifying action).',
    category: 'citizen', xp: 50,  cooldownHrs: 168, maxPerDay: 1,
  },
  // NGO
  {
    action: 'ngo_create_mission',    label: 'NGO: Mission Approved',
    description: 'NGO account earns XP when a mission is approved by admin.',
    category: 'ngo', xp: 15, cooldownHrs: 0, maxPerDay: 10,
  },
  {
    action: 'ngo_mission_completed', label: 'NGO: Mission Completed',
    description: 'NGO earns XP when ending an event with ≥1 present volunteer.',
    category: 'ngo', xp: 30, cooldownHrs: 0, maxPerDay: 0,
  },
  // SYSTEM
  {
    action: 'admin_manual_award',    label: 'Admin Manual Award',
    description: 'Super Admin manually awards XP to any user for any reason.',
    category: 'system', xp: 0, cooldownHrs: 0, maxPerDay: 0, enabled: true,
  },
];

/**
 * seedXpRules — call once on server startup.
 * Inserts defaults only if collection is empty. Never overwrites custom rules.
 */
export const seedXpRules = async () => {
  const count = await XpRule.countDocuments();
  if (count === 0) {
    await XpRule.insertMany(DEFAULT_XP_RULES);
    console.log(`[XP Engine] Seeded ${DEFAULT_XP_RULES.length} default XP rules.`);
  }
};

export default XpRule;
