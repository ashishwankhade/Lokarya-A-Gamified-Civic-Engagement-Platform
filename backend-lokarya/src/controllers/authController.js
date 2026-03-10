import asyncHandler from '../utils/asyncHandler.js';
import User         from '../models/User.js';
import Complaint    from '../models/Complaint.js';
import Activity     from '../models/Activity.js';
import jwt          from 'jsonwebtoken';
import crypto       from 'crypto';
import { awardSpecialBadge, getUserBadges } from '../services/badgeService.js';

// ─── HELPER ───────────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';

const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const plainRefreshToken = crypto.randomBytes(40).toString('hex');

  await user.setRefreshToken(plainRefreshToken);
  await user.save({ validateBeforeSave: false });

  // FIX: sameSite must be 'none' for cross-origin (Vercel → Render)
  // sameSite: 'strict' or 'lax' blocks cookies across different domains
  res.cookie('token', accessToken, {
    expires:  new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure:   true,       // required when sameSite is 'none'
    sameSite: 'none',     // allows cross-origin cookie sending
  });

  res.cookie('refreshToken', plainRefreshToken, {
    expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    path:     '/api/auth/refresh',
  });

  user.password = undefined;

  res.status(statusCode).json({
    success:      true,
    _id:          user._id,
    name:         user.name,
    email:        user.email,
    role:         user.role,
    avatar:       user.avatar       || '',
    location:     user.location     || '',
    isVerified:   user.isVerified,
    xp:           user.xp           || 0,
    level:        user.level        || 1,
    currentLevel: user.currentLevel || 'Civic Scout',
    totalPoints:  user.totalPoints  || 0,
    nextLevelXP:  user.nextLevelXP  || 200,
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const allowedRoles = ['citizen', 'ngo_admin', 'local_authority'];
  const assignedRole = allowedRoles.includes(role) ? role : 'citizen';
  const isVerified   = !(assignedRole === 'ngo_admin' || assignedRole === 'local_authority');

  const user = await User.create({
    name, email, password,
    role:           assignedRole,
    isVerified,
    xp:             0,
    totalPoints:    0,
    lifetimePoints: 0,
    level:          1,
    currentLevel:   'Civic Scout',
    nextLevelXP:    200,
    badges:         [],
    avatar:         '',
    location:       '',
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid user data');
  }

  // Award first_login badge (fire-and-forget — never blocks response)
  awardSpecialBadge(user._id, 'first_login').catch(err =>
    console.error('[Badge] first_login award failed:', err.message)
  );

  await sendTokenResponse(user, 201, res);
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isVerified) {
    res.status(403);
    throw new Error('Your account is pending approval by the Administrator.');
  }
  if (user.banned) {
    res.status(403);
    throw new Error('Your account has been suspended. Contact support.');
  }

  await sendTokenResponse(user, 200, res);
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
const logoutUser = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies.refreshToken;
  if (incomingToken) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.clearRefreshToken();
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Access token may already be expired — fine, still clear cookies
    }
  }

  // FIX: match same sameSite/secure settings used when setting cookies
  const cookieDefaults = {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    expires:  new Date(Date.now() + 10 * 1000),
  };

  res.cookie('token',        'none', cookieDefaults);
  res.cookie('refreshToken', 'none', { ...cookieDefaults, path: '/api/auth/refresh' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies.refreshToken;
  if (!incomingToken) {
    res.status(401);
    throw new Error('No refresh token');
  }

  const user = await User.findOne({
    refreshToken:       { $ne: null },
    refreshTokenExpiry: { $gt: new Date() },
    banned:             false,
    isVerified:         true,
  }).select('+refreshToken +refreshTokenExpiry');

  const isValid = user && await user.matchRefreshToken(incomingToken);

  if (!isValid) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }

  const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  // FIX: match same sameSite/secure settings
  res.cookie('token', newAccessToken, {
    expires:  new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
  });

  res.status(200).json({ success: true });
});

// ─── GET ME ───────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user    = await User.findById(req.user._id).select('xp');
  const freshXp = user?.xp ?? req.user.xp ?? 0;

  res.json({
    _id:              req.user._id,
    name:             req.user.name,
    email:            req.user.email,
    role:             req.user.role,
    avatar:           req.user.avatar           || null,
    isVerified:       req.user.isVerified        ?? true,
    organizationName: req.user.organizationName  || null,
    vibhag:           req.user.vibhag            || null,
    xp:               freshXp,
    level:            req.user.level            || 1,
    currentLevel:     req.user.currentLevel     || 'Civic Scout',
    totalPoints:      req.user.totalPoints      || 0,
    nextLevelXP:      req.user.nextLevelXP      || 200,
  });
});

// ─── GET FULL PROFILE ─────────────────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const complaintCount = await Complaint.countDocuments({ user: req.user._id });

  const userMissions = await Activity.find({ 'attendance.user': req.user._id });
  const missionCount = userMissions.length;

  const recentComplaints = await Complaint.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  const complaintHistory = recentComplaints.map(c => ({
    id:     c._id,
    type:   'complaint',
    title:  c.title,
    status: c.status,
    date:   c.createdAt,
    points: c.status === 'resolved' ? 25 : 10,
  }));

  const missionHistory = userMissions.map(m => {
    const entry = m.attendance?.find(
      a => (typeof a.user === 'object' ? a.user._id : a.user)?.toString() === req.user._id.toString()
    );
    return {
      id:     m._id,
      type:   'mission',
      title:  m.title,
      status: entry?.finalStatus || 'registered',
      date:   m.date,
      points: entry?.pointsCredited ? (entry.totalPoints || m.pointsReward) : 0,
    };
  });

  const unifiedHistory = [...complaintHistory, ...missionHistory]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  // Fetch real badges from UserBadge collection
  const badges = await getUserBadges(req.user._id);

  res.json({
    _id:            user._id,
    name:           user.name,
    email:          user.email,
    role:           user.role,
    avatar:         user.avatar,
    location:       user.location,
    xp:             user.xp             || 0,
    currentXP:      user.xp             || 0,
    level:          user.level          || 1,
    currentLevel:   user.currentLevel,
    totalPoints:    user.totalPoints    || 0,
    lifetimePoints: user.lifetimePoints || 0,
    nextLevelXP:    user.nextLevelXP    || 200,
    badges,
    pointHistory:   user.pointHistory   || [],
    stats: {
      missions:    missionCount,
      reports:     complaintCount,
      impactScore: '100%',
    },
    history: unifiedHistory,
  });
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.name     = req.body.name     || user.name;
  user.location = req.body.location || user.location;
  if (req.body.password) user.password = req.body.password;
  if (req.file)          user.avatar   = req.file.path;

  const updated = await user.save();

  // Award profile_complete badge when name + location + avatar all filled
  const isProfileComplete = updated.name && updated.location && updated.avatar;
  if (isProfileComplete) {
    awardSpecialBadge(updated._id, 'profile_complete').catch(err =>
      console.error('[Badge] profile_complete award failed:', err.message)
    );
  }

  res.json({
    _id:      updated._id,
    name:     updated.name,
    email:    updated.email,
    role:     updated.role,
    avatar:   updated.avatar,
    location: updated.location,
    xp:       updated.xp || 0,
  });
});

export {
  registerUser, loginUser, logoutUser,
  refreshAccessToken, getMe, getUserProfile, updateProfile,
};