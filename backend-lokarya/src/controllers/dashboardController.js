import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Activity from '../models/Activity.js';

// ==========================================
// 1. SUPER ADMIN DASHBOARD
// ==========================================
const getSuperAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalNGOs = await User.countDocuments({ role: 'ngo_admin' });
  const totalAuthorities = await User.countDocuments({ role: 'local_authority' });
  const pendingApprovals = await User.countDocuments({ isVerified: false });

  const totalComplaints = await Complaint.countDocuments();
  const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
  const totalActivities = await Activity.countDocuments();

  res.json({
    users: {
      total: totalUsers,
      ngos: totalNGOs,
      authorities: totalAuthorities,
      pendingApprovals: pendingApprovals 
    },
    system: {
      totalComplaints,
      resolvedComplaints,
      totalActivities
    }
  });
});

// ==========================================
// 2. NGO ADMIN DASHBOARD (Updated for Table)
// ==========================================
const getNGOStats = asyncHandler(async (req, res) => {
  const ngoId = req.user._id;

  // 1. Mission Stats
  const activeActivitiesCount = await Activity.countDocuments({ ngo: ngoId, status: 'open' });
  
  // 2. Pending Verifications Badge Logic
  const pendingVerifications = await Activity.aggregate([
    { $match: { ngo: ngoId } },
    { $unwind: '$participants' },
    { $match: { 'participants.status': 'pending' } },
    { $count: 'count' }
  ]);
  const pendingCount = pendingVerifications.length > 0 ? pendingVerifications[0].count : 0;

  // 3. Total Volunteers Impact (Approved participants across all my missions)
  const totalVolunteersAgg = await Activity.aggregate([
    { $match: { ngo: ngoId } },
    { $unwind: '$participants' },
    { $match: { 'participants.status': 'approved' } },
    { $count: 'count' }
  ]);
  const totalVolunteers = totalVolunteersAgg.length > 0 ? totalVolunteersAgg[0].count : 0;

  // 4. Recent Missions List (CRITICAL for the Dashboard Table)
  // We use this to show the missions you've created so you can EDIT them
  const recentMissions = await Activity.find({ ngo: ngoId })
    .sort({ createdAt: -1 }) // Newest created first
    .limit(10); // Show more on dashboard for better management

  res.json({
    stats: {
      activeMissions: activeActivitiesCount,
      pendingVolunteers: pendingCount,
      totalVolunteers: totalVolunteers,
      pointsIssued: totalVolunteers * 50 // Example estimation or aggregate from pointsReward
    },
    recentMissions // <--- Matches the key used in your Frontend Dashboard
  });
});

// ==========================================
// 3. AUTHORITY DASHBOARD
// ==========================================
const getAuthorityStats = asyncHandler(async (req, res) => {
  const pendingCount = await Complaint.countDocuments({ status: 'pending' });
  const inProgressCount = await Complaint.countDocuments({ status: 'in_progress' });
  const resolvedCount = await Complaint.countDocuments({ status: 'resolved' });

  const urgentComplaints = await Complaint.find({ status: 'pending' })
    .sort({ supportCount: -1, createdAt: -1 })
    .limit(5)
    .select('title category location supportCount createdAt image');

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