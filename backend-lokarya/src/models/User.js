import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const pointHistorySchema = new mongoose.Schema({
  reason: { type: String, required: true },
  pointsChanged: { type: Number, required: true }, // Positive for earning, Negative for spending
  date: { type: Date, default: Date.now }
});

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // --- Profile Fields ---
    avatar: { 
      type: String, 
      default: "" 
    },
    location: { 
      type: String, 
      default: "" 
    },

    role: {
      type: String,
      enum: ['user', 'ngo_admin', 'local_authority', 'super_admin'],
      default: 'user',
    },
    
    // --- Security Verification ---
    isVerified: {
      type: Boolean,
      default: false, 
    },

    // --- Gamification (Spendable Wallet vs. Permanent Rank) ---
    
    // 1. Current Spendable Points (The "Wallet" for Rewards Store)
    totalPoints: { 
      type: Number, 
      default: 0 
    },

    // 2. Permanent Points (Used for Rank & Leaderboard - NEVER decreases)
    lifetimePoints: { 
      type: Number, 
      default: 0 
    },

    // Numeric Level (1 through 5)
    level: { 
      type: Number, 
      default: 1 
    },

    // Level Name (e.g., "Impact Maker")
    currentLevel: { 
      type: String, 
      default: 'Civic Scout' 
    },

    // Target XP for the next level up
    nextLevelXP: { 
      type: Number, 
      default: 200 
    },

    badges: [{ 
      name: String, 
      icon: String, 
      earnedDate: { type: Date, default: Date.now } 
    }],
    
    pointHistory: [pointHistorySchema], 
    
    // --- Organization / Authority Specific ---
    organizationName: { type: String },
    department: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;