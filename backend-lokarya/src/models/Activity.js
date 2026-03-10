import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // registration status (Step 3)
  registrationStatus: {
    type: String,
    enum: ['registered', 'cancelled'],
    default: 'registered',
  },
  registeredAt:   { type: Date, default: Date.now },
  confirmationSmsSent: { type: Boolean, default: false },

  // QR scan result (Step 4-5)
  scannedAt:      { type: Date },
  scanGps:        { lat: Number, lng: Number },
  gpsDistanceMeters: { type: Number },
  gpsVerified:    { type: Boolean, default: false },   // Layer 2 passed
  gpsOverride:    { type: Boolean, default: false },   // NGO manually confirmed (GPS fail fallback)
  scanDuplicate:  { type: Boolean, default: false },   // Layer 3 triggered

  // NGO final review (Step 6)
  finalStatus: {
    type: String,
    enum: ['pending', 'present', 'absent', 'rejected'],
    default: 'pending',
  },
  markedAbsentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Points credited (Step 7)
  pointsCredited: { type: Boolean, default: false },
  basePoints:     { type: Number, default: 0 },
  bonusPoints:    { type: Number, default: 0 },
  bonusBreakdown: {
    earlyBird:     { type: Number, default: 0 },  // registered within 24h of posting
    streak:        { type: Number, default: 0 },  // consecutive missions
    bringAFriend:  { type: Number, default: 0 },  // referred a friend who also attended
  },
  totalPoints:    { type: Number, default: 0 },
}, { _id: false });

const activitySchema = mongoose.Schema(
  {
    // ─────────────────────────────────────────────────────────
    // STEP 1 — NGO Creates
    // ─────────────────────────────────────────────────────────
    ngo:         { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600',
    },
    category: {
      type: String,
      enum: ['Environment','Education','Healthcare','Social','Animal Welfare','Sanitation','Disaster Relief'],
      required: true,
    },
    pointsReward:    { type: Number, default: 50, min: 0 },
    date:            { type: Date, required: true },
    deadline:        { type: Date, required: true },
    location: {
      name:    { type: String, required: true },
      address: { type: String },
      lat:     { type: Number, required: true },   // GPS required for QR flow
      lng:     { type: Number, required: true },
    },
    maxParticipants: { type: Number, required: true, default: 10 },
    requirements:    [{ type: String }],
    contactInfo:     { type: String, required: true },

    // Admin approval (Step 1 → Step 2 gate)
    adminStatus: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'pending_approval',
    },
    adminNote:   { type: String },
    approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt:  { type: Date },

    // Activity lifecycle
    status: {
      type: String,
      enum: ['draft', 'open', 'ongoing', 'ended', 'completed'],
      default: 'draft',  // becomes 'open' after admin approval
    },

    // ─────────────────────────────────────────────────────────
    // STEP 2 — QR Token (generated after admin approval)
    // ─────────────────────────────────────────────────────────
    qr: {
      token:     { type: String },            // signed JWT-like secret
      payload:   { type: String },            // base64 encoded QR data (activityId + token + expiry + GPS)
      expiresAt: { type: Date },              // auto-expires after event end + 2h
      isActive:  { type: Boolean, default: false },
      generatedAt: { type: Date },
    },

    // ─────────────────────────────────────────────────────────
    // GPS & RADIUS CONFIG
    // ─────────────────────────────────────────────────────────
    gpsRadiusMeters: { type: Number, default: 300 },  // Layer 2 gate radius

    // ─────────────────────────────────────────────────────────
    // STEP 3–7 — Attendance
    // ─────────────────────────────────────────────────────────
    attendance: [attendanceSchema],

    // Step 6 — NGO ends event
    endedAt:   { type: Date },
    endedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Step 7 — All points distributed
    pointsDistributedAt: { type: Date },

    // Bonus config (editable by NGO)
    bonusConfig: {
      earlyBirdMultiplier:   { type: Number, default: 1.2 },  // 20% bonus if registered within 24h of post
      streakBonus:           { type: Number, default: 10 },   // flat XP per consecutive-mission streak level
      bringAFriendBonus:     { type: Number, default: 15 },   // XP if referred friend also attended
    },

    // Legacy participants array kept for backward-compat with existing ActivityPage
    participants: [
      {
        user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status:   { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
activitySchema.virtual('volunteerCount').get(function () {
  return this.attendance.filter(a => a.finalStatus === 'present').length;
});

activitySchema.virtual('registeredCount').get(function () {
  return this.attendance.filter(a => a.registrationStatus === 'registered').length;
});

activitySchema.virtual('spotsLeft').get(function () {
  const active = this.attendance.filter(a => a.registrationStatus === 'registered');
  return Math.max(0, this.maxParticipants - active.length);
});

activitySchema.virtual('isQrActive').get(function () {
  return (
    this.qr?.isActive &&
    this.qr?.expiresAt &&
    new Date() < new Date(this.qr.expiresAt)
  );
});

// ── INDEXES ───────────────────────────────────────────────────────────────────
activitySchema.index({ status: 1, date: 1 });
activitySchema.index({ ngo: 1, adminStatus: 1 });
activitySchema.index({ 'qr.token': 1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
