import mongoose from "mongoose";
import bcrypt from "bcrypt";

const pointHistorySchema = new mongoose.Schema({
  reason: { type: String, required: true },
  pointsChanged: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // --- Profile ---
    avatar: { type: String, default: "" },
    location: { type: String, default: "" },

    // ── CONTACT ───────────────────────────────────────────────────────────
    // Stored as a plain string so it works for IN (+91) or any country code.
    // Validate format on the frontend / with a validator middleware.
    phone: { type: String, default: null },

    // ── ROLES ─────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: [
        "citizen",
        "ngo_admin",
        "local_authority",
        "super_admin",
        "field_worker",
      ],
      default: "citizen",
    },

    isVerified: { type: Boolean, default: true },

    // ── GAMIFICATION (OLD — kept for backward compat) ──────────────────────
    totalPoints: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentLevel: { type: String, default: "Civic Scout" },
    nextLevelXP: { type: Number, default: 200 },

    badges: [
      {
        name: String,
        icon: String,
        earnedDate: { type: Date, default: Date.now },
      },
    ],

    pointHistory: [pointHistorySchema],

    // ── GAMIFICATION (NEW — XP Engine) ─────────────────────────────────────
    xp: { type: Number, default: 0, min: 0 },

    // ── PLATFORM MODERATION ────────────────────────────────────────────────
    banned: { type: Boolean, default: false },

    // ── ORG / AUTHORITY SPECIFIC ───────────────────────────────────────────
    organizationName: { type: String },
    department: { type: String },
    vibhag: { type: String },
    logo: { type: String },

    // ── AUTH ───────────────────────────────────────────────────────────────
    isOAuthUser: { type: Boolean, default: false },
    // ── OAUTH ONE-TIME TOKEN (for cross-origin Google login) ───────────────
    oauthToken: { type: String, default: null },
    oauthTokenExpiry: { type: Date, default: null },
    // ── REFRESH TOKEN ──────────────────────────────────────────────────────
    refreshToken: { type: String, default: null },
    refreshTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
userSchema.index({ xp: -1 });
userSchema.index({ role: 1 });
userSchema.index({ banned: 1 });

// ── PRE-SAVE: password hashing ────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.isOAuthUser) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchRefreshToken = async function (token) {
  if (!this.refreshToken) return false;
  if (this.refreshTokenExpiry && this.refreshTokenExpiry < new Date())
    return false;
  return await bcrypt.compare(token, this.refreshToken);
};

userSchema.methods.setRefreshToken = async function (plainToken) {
  const rounds = parseInt(process.env.BCRYPT_REFRESH_ROUNDS) || 10;
  this.refreshToken = await bcrypt.hash(plainToken, rounds);
  this.refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

userSchema.methods.clearRefreshToken = function () {
  this.refreshToken = null;
  this.refreshTokenExpiry = null;
};

const User = mongoose.model("User", userSchema);
export default User;
