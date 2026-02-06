import  asyncHandler  from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notificationSystem.js';

// @desc    Get all users waiting for approval
// @route   GET /api/admin/pending
const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isVerified: false })
    .select('-password') 
    .sort({ createdAt: -1 });
  
  res.json(users);
});

// @desc    Approve (Verify) a user
// @route   PUT /api/admin/approve/:id
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isVerified = true;
  await user.save();

  await sendNotification(
    user._id,
    "Welcome! Your account has been approved by the Administrator. You can now access the dashboard.",
    'success'
  );

  res.json({ message: `User ${user.name} has been approved.` });
});

// @desc    Reject/Delete a user
// @route   DELETE /api/admin/reject/:id
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne();

  res.json({ message: 'User request rejected and account deleted.' });
});

// @desc    Super Admin creates a new verified user manually
// @route   POST /api/admin/create-user
const createUserByAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create User (Force Verified = true)
  const user = await User.create({
    name,
    email,
    password,
    role,
    isVerified: true, // Auto-verified since Admin created it
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// ------------------------------------------------------------------
// NEW FUNCTION: Fetch Officers for Assignment
// ------------------------------------------------------------------

// @desc    Get list of officers/authorities for assignment dropdown
// @route   GET /api/admin/officers
const getOfficers = asyncHandler(async (req, res) => {
  // Fetch users who are Authorities or NGO Admins (people who can do work)
  // You can customize this filter if you have a specific 'field_officer' role
  const officers = await User.find({ 
    role: { $in: ['local_authority', 'ngo_admin'] },
    isVerified: true 
  }).select('name email role _id image');
  
  res.json(officers);
});

export { 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  createUserByAdmin,
  getOfficers // <--- Export the new function
};