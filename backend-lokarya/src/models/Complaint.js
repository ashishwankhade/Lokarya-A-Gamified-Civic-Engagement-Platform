import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── Timeline Entry ────────────────────────────────────────────────────────────
const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: [
      'pending',          // Step 1 — citizen filed
      'under_review',     // Step 3 — authority opened
      'officer_assigned', // Step 3 — ward officer assigned
      'worker_assigned',  // Step 4 — field worker assigned, magic token sent
      'worker_accepted',  // Step 6 — worker replied "1"
      'in_progress',      // Step 6 — worker on ground
      'resolved',         // Step 8 — ward officer marked resolved
      'closed',           // Step 9 — citizen confirmed OR auto-closed
      'escalated',        // Step 9 — citizen rated 1-2★
      'rejected',
    ],
  },
  date:      { type: Date, default: Date.now },
  message:   { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  proofPhoto: { type: String }, // for resolved step
});

// ─── Main Schema ───────────────────────────────────────────────────────────────
const complaintSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    ticketId: {
      type: String,
      unique: true,
      // Generated in pre-save: LKY-2026-XXXX
    },

    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    title:       { type: String, required: true },
    description: { type: String, required: true },

    category: {
      type: String,
      enum: ['Garbage', 'Roads', 'Water', 'Electricity', 'Traffic', 'Other'],
      required: true,
    },

    vibhag: {
      type: String,
      enum: [
        'Dharampeth','Dhantoli','Nehru Nagar','Gandhi Nagar','Hanuman Nagar',
        'Mangalwari','Ashi Nagar','Satranjipura','Lakadganj',
        'East Nagpur','West Nagpur','South Nagpur','North Nagpur','Other',
      ],
      default: '',
    },

    location: {
      address: { type: String, required: true },
      lat:     { type: Number, required: true },
      lng:     { type: Number, required: true },
      pinCode: { type: String }, // auto-detected from reverse geocode
    },

    image: { type: String }, // citizen's initial photo

    // ── Status & SLA ──────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        'pending', 'under_review', 'officer_assigned', 'worker_assigned',
        'worker_accepted', 'in_progress', 'resolved', 'closed', 'escalated', 'rejected',
      ],
      default: 'pending',
    },

    slaDeadline: { type: Date }, // createdAt + 4hrs — set in pre-save
    slaBreached: { type: Boolean, default: false },

    // ── Assignment Chain (Step 3 → 4) ─────────────────────────────────────────
    // Ward Officer (Authority user who owns this vibhag)
    assignedOfficer: {
      name:        { type: String },
      designation: { type: String },
      contact:     { type: String },
      userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    // Field Worker (assigned by Ward Officer in Step 4)
    assignedWorker: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'FieldWorker',
      default: null,
    },

    // ── Magic Token (Step 4 → 7) ──────────────────────────────────────────────
    magicToken:       { type: String, default: null },   // UUID for upload link
    magicTokenExpiry: { type: Date,   default: null },   // 48hrs from generation
    workerPhone:      { type: String, default: null },   // WhatsApp number messaged

    // ── Resolution (Step 7 → 8) ───────────────────────────────────────────────
    resolutionImage: { type: String },  // proof photo uploaded via magic link
    resolutionNote:  { type: String },  // ward officer's closing note

    // ── Citizen Rating (Step 9) ───────────────────────────────────────────────
    citizenRating:   { type: Number, min: 1, max: 5, default: null },
    ratingNote:      { type: String },
    escalationCount: { type: Number, default: 0 },
    autoClosedAt:    { type: Date, default: null },

    // ── Duplicate / Upvote ────────────────────────────────────────────────────
    upvotes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    supportedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    supportCount: { type: Number, default: 1 },

    // ── Timeline ──────────────────────────────────────────────────────────────
    timeline:   [timelineSchema],
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ─── Pre-save: generate ticketId + SLA + initial timeline ─────────────────────
complaintSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  // 1. Generate ticketId: LKY-2026-XXXX (zero-padded sequential)
  const year = new Date().getFullYear();
  const count = await mongoose.model('Complaint').countDocuments();
  this.ticketId = `LKY-${year}-${String(count + 1).padStart(4, '0')}`;

  // 2. SLA deadline — 4 hours from now
  this.slaDeadline = new Date(Date.now() + 4 * 60 * 60 * 1000);

  // 3. Initial timeline entry
  if (this.timeline.length === 0) {
    this.timeline.push({
      status:    'pending',
      message:   `Complaint filed. Ticket ID: ${this.ticketId}`,
      updatedBy: this.user,
    });
  }

  // 4. Ensure creator in supportedBy + upvotes
  if (!this.supportedBy.includes(this.user)) this.supportedBy.push(this.user);
  if (!this.upvotes.includes(this.user))      this.upvotes.push(this.user);

  next();
});

// ─── Instance method: generate magic token ────────────────────────────────────
complaintSchema.methods.generateMagicToken = function () {
  this.magicToken       = crypto.randomUUID();
  this.magicTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48hrs
  return this.magicToken;
};

// ─── Instance method: check if magic token is valid ───────────────────────────
complaintSchema.methods.isMagicTokenValid = function (token) {
  return (
    this.magicToken === token &&
    this.magicTokenExpiry &&
    this.magicTokenExpiry > new Date()
  );
};

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
