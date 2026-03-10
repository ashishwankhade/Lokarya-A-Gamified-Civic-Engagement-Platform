/**
 * UserBadge.js
 * Records every badge a user has earned.
 * Separate from User.badges[] array to keep User doc lean and support querying.
 * Path: backend-lokarya/src/models/UserBadge.js
 */

import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
    key:   { type: String, required: true }, // denormalized for fast lookup without populate
    // When and why it was awarded
    earnedAt: { type: Date, default: Date.now },
    trigger:  { type: String }, // e.g. "xp_milestone:200", "action_count:file_complaint:5"
  },
  { timestamps: false }
);

// One badge per user — no duplicates
userBadgeSchema.index({ user: 1, key: 1 }, { unique: true });
userBadgeSchema.index({ user: 1, earnedAt: -1 });

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);
export default UserBadge;
