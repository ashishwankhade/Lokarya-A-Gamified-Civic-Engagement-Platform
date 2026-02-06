import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js'; 
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Verification Logic
  let isVerified = true; 
  if (role === 'ngo_admin' || role === 'local_authority') {
    isVerified = false;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
    isVerified,
    // --- UPDATED DEFAULTS ---
    totalPoints: 0,
    lifetimePoints: 0,    // Permanent rank tracker
    level: 1,
    currentLevel: 'Civic Scout',
    nextLevelXP: 200,      // Matches level 1 threshold
    badges: [],
    avatar: "", 
    location: ""
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      location: user.location,
      isVerified: user.isVerified,
      token: generateToken(user._id),
      message: isVerified 
        ? "Registration successful" 
        : "Registration successful. Please wait for Super Admin approval."
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user & Check Verification
// @route   POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    
    if (!user.isVerified) {
      res.status(403); 
      throw new Error('Your account is pending approval by the Administrator.');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      location: user.location,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get full user profile with stats and history
// @route   GET /api/auth/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // 1. Fetch Real Stats
    const complaintCount = await Complaint.countDocuments({ user: req.user._id });
    const missionCount = 0; 

    // 2. Fetch History (Recent Activity)
    const recentComplaints = await Complaint.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const history = recentComplaints.map(c => ({
      id: c._id,
      type: 'complaint', 
      title: c.title,
      status: c.status, 
      date: c.createdAt,
      points: c.status === 'resolved' ? 50 : 20 // Matches your gamificationRules.js
    }));

    // 3. Send Unified Response (SEAMLESS SYNC)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      location: user.location,
      
      // --- GAMIFICATION SYNC ---
      level: user.level || 1,              // Numeric Level
      currentLevel: user.currentLevel,     // Level Name (e.g. Urban Guardian)
      totalPoints: user.totalPoints || 0,  // Spendable Wallet
      lifetimePoints: user.lifetimePoints || 0, // Permanent Rank Points
      nextLevelXP: user.nextLevelXP || 200, // Dynamic threshold from DB
      badges: user.badges || [],
      pointHistory: user.pointHistory || [],
      
      stats: {
        missions: missionCount,
        reports: complaintCount,
        impactScore: "100%" 
      },
      
      history: history
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update User Profile
// @route   PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.location = req.body.location || user.location;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.file) {
      user.avatar = req.file.path; 
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      location: updatedUser.location,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { registerUser, loginUser, getUserProfile, updateProfile };