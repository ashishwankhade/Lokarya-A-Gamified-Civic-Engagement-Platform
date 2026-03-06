import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js'; 
import Activity from '../models/Activity.js';
import jwt from 'jsonwebtoken';

// --- HELPER: Set Cookie & Send Response ---
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true, // IMPORTANT: Prevents XSS (JS cannot read this)
    // FIX: 'secure' must be false on localhost (http), true on production (https)
    secure: process.env.NODE_ENV === 'production', 
    // FIX: 'lax' is safer for localhost development to prevent 401 errors
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  user.password = undefined; // Hide password from response

  res.status(statusCode)
    .cookie('token', token, cookieOptions) // <--- Sets the HttpOnly Cookie
    .json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      location: user.location,
      isVerified: user.isVerified
      // Removed 'token' from JSON body. It's in the cookie now!
    });
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
    // Defaults
    totalPoints: 0,
    lifetimePoints: 0,
    level: 1,
    currentLevel: 'Civic Scout',
    nextLevelXP: 200,
    badges: [],
    avatar: "", 
    location: ""
  });

  if (user) {
    sendTokenResponse(user, 201, res);
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
    sendTokenResponse(user, 200, res);
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user (Clear Cookie)
// @route   GET /api/auth/logout
const logoutUser = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get full user profile with stats and history
// @route   GET /api/auth/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // 1. Fetch Real Stats
    const complaintCount = await Complaint.countDocuments({ user: req.user._id });
    const userMissions = await Activity.find({ "participants.user": req.user._id });
    const missionCount = userMissions.length;

    // 2. Fetch History
    const recentComplaints = await Complaint.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(10);

    const complaintHistory = recentComplaints.map(c => ({
      id: c._id, type: 'complaint', title: c.title, status: c.status, date: c.createdAt,
      points: c.status === 'resolved' ? 50 : 20
    }));

    const missionHistory = userMissions.map(m => {
      const participantInfo = m.participants.find(p => p.user.toString() === req.user._id.toString());
      return {
        id: m._id, type: 'mission', title: m.title,
        status: participantInfo ? participantInfo.status : 'pending',
        date: m.date,
        points: participantInfo?.status === 'approved' ? m.pointsReward : 0
      };
    });

    const unifiedHistory = [...complaintHistory, ...missionHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      location: user.location,
      level: user.level || 1,
      currentLevel: user.currentLevel,
      currentXP: user.lifetimePoints || 0,
      totalPoints: user.totalPoints || 0,
      lifetimePoints: user.lifetimePoints || 0,
      nextLevelXP: user.nextLevelXP || 200,
      badges: user.badges || [],
      pointHistory: user.pointHistory || [],
      stats: { missions: missionCount, reports: complaintCount, impactScore: "100%" },
      history: unifiedHistory
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
    if (req.body.password) user.password = req.body.password;
    if (req.file) user.avatar = req.file.path; 

    const updatedUser = await user.save();

    // No need to resend token, the cookie persists
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      location: updatedUser.location,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { registerUser, loginUser, logoutUser, getUserProfile, updateProfile };