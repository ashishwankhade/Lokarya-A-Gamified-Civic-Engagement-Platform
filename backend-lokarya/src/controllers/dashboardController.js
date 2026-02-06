import  asyncHandler  from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Activity from '../models/Activity.js';

// ==========================================
// 1. SUPER ADMIN DASHBOARD (The "God Mode")
// ==========================================
// @desc    Get System Health & Stats
// @route   GET /api/dashboard/super-admin
const getSuperAdminStats = asyncHandler(async (req, res) => {
  // 1. User Counts (For "User Management" & "Approve Authorities")
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalNGOs = await User.countDocuments({ role: 'ngo_admin' });
  const totalAuthorities = await User.countDocuments({ role: 'local_authority' });
  
  // Critical: How many are waiting for approval? (Notification Badge)
  const pendingApprovals = await User.countDocuments({ isVerified: false });

  // 2. Complaint Health (For "Global Map" / Stats)
  const totalComplaints = await Complaint.countDocuments();
  const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
  
  // 3. Activity Health
  const totalActivities = await Activity.countDocuments();

  res.json({
    users: {
      total: totalUsers,
      ngos: totalNGOs,
      authorities: totalAuthorities,
      pendingApprovals: pendingApprovals // Use this to show a red badge!
    },
    system: {
      totalComplaints,
      resolvedComplaints,
      totalActivities
    }
  });
});

// ==========================================
// 2. NGO ADMIN DASHBOARD (Engagement Focused)
// ==========================================
// @desc    Get Activity & Volunteer Stats
// @route   GET /api/dashboard/ngo
const getNGOStats = asyncHandler(async (req, res) => {
  const ngoId = req.user._id;

  // 1. Active Missions (For "My Dashboard" & "Manage Activities")
  const activeActivitiesCount = await Activity.countDocuments({ ngo: ngoId, status: 'open' });
  
  // 2. Pending Verifications (For "Verify Attendance" - Badge Alert)
  // Logic: Find my activities, unwind participants, count those who are 'pending'
  const pendingVerifications = await Activity.aggregate([
    { $match: { ngo: ngoId } },
    { $unwind: '$participants' },
    { $match: { 'participants.status': 'pending' } },
    { $count: 'count' }
  ]);
  const pendingCount = pendingVerifications.length > 0 ? pendingVerifications[0].count : 0;

  // 3. Upcoming Events List (For "Home" widget)
  const upcomingEvents = await Activity.find({ ngo: ngoId, status: 'open' })
    .sort({ date: 1 }) // Soonest first
    .limit(3)
    .select('title date location participants');

  res.json({
    stats: {
      activeMissions: activeActivitiesCount,
      pendingVolunteers: pendingCount, // Use this for Red Badge on Sidebar
    },
    upcomingEvents
  });
});

// ==========================================
// 3. AUTHORITY DASHBOARD (Resolution Focused)
// ==========================================
// @desc    Get Complaint Workflows
// @route   GET /api/dashboard/authority
const getAuthorityStats = asyncHandler(async (req, res) => {
  // 1. Inbox Counts (For Sidebar Badges)
  const pendingCount = await Complaint.countDocuments({ status: 'pending' });
  const inProgressCount = await Complaint.countDocuments({ status: 'in_progress' });
  const resolvedCount = await Complaint.countDocuments({ status: 'resolved' });

  // 2. High Priority / Hot List (For "Inbox (New)")
  // Logic: Pending complaints sorted by most Upvotes (Support Count)
  const urgentComplaints = await Complaint.find({ status: 'pending' })
    .sort({ supportCount: -1, createdAt: -1 }) // Most supported & newest
    .limit(5)
    .select('title category location supportCount createdAt image');

  // 3. Category Breakdown (For Pie Chart)
  const categoryStats = await Complaint.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  res.json({
    counts: {
      pending: pendingCount,
      inProgress: inProgressCount,
      resolved: resolvedCount
    },
    urgentTasks: urgentComplaints,
    chartData: categoryStats
  });
});

export { getSuperAdminStats, getNGOStats, getAuthorityStats };