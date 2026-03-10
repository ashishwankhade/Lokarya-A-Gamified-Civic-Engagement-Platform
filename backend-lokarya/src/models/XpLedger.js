/**
 * XpLedger.js
 * Immutable ledger of every XP transaction in the platform.
 * Used for audit trail, cooldown checks, daily-limit checks, and analytics.
 * Path: backend-lokarya/src/models/XpLedger.js
 */

import mongoose from 'mongoose';

const xpLedgerSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true, index: true },
    action:  { type: String,                                            required: true, index: true },
    xp:      { type: Number,                                            required: true },   // can be negative for future deductions
    balance: { type: Number,                                            required: true },   // user's XP total after this entry
    meta: {
      complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
      activityId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Activity'  },
      awardedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User'      }, // super admin
      note:        { type: String },
    },
  },
  {
    timestamps: true, // ledger entries are append-only
  }
);

xpLedgerSchema.index({ user: 1, action: 1, createdAt: -1 });
xpLedgerSchema.index({ createdAt: -1 });

const XpLedger = mongoose.model('XpLedger', xpLedgerSchema);
export default XpLedger;
