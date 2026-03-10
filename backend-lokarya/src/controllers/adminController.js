/**
 * adminController.js
 * Full platform control for super_admin.
 * Path: backend-lokarya/src/controllers/adminController.js
 *
 * ─────────────────────────────────────────────────────────────
 *  PLATFORM STATS       GET  /api/admin/stats
 *  ANALYTICS            GET  /api/admin/analytics?period=30
 *
 *  USER MANAGEMENT
 *    getAllUsers         GET    /api/admin/users
 *    getUserDetail       GET    /api/admin/users/:id
 *    updateUserRole      PATCH  /api/admin/users/:id/role
 *    toggleUserBan       PATCH  /api/admin/users/:id/ban
 *    manualAwardXp       POST   /api/admin/users/:id/award-xp
 *    revokeXp            POST   /api/admin/users/:id/revoke-xp   ← NEW
 *    deleteUser          DELETE /api/admin/users/:id
 *
 *  NGO MANAGEMENT
 *    getAllNgos          GET  /api/admin/ngos
 *    updateNgoStatus     PATCH /api/admin/ngos/:id/status
 *
 *  ACTIVITY APPROVAL
 *    getPendingActivities GET  /api/admin/activities/pending
 *    reviewActivity       PATCH /api/admin/activities/:id/review
 *
 *  COMPLAINT OVERSIGHT
 *    getAllComplaintsAdmin GET   /api/admin/complaints
 *    forceComplaintStatus  PATCH /api/admin/complaints/:id/force-status
 *
 *  XP RULE ENGINE
 *    getXpRules          GET  /api/admin/xp-rules
 *    updateXpRule        PATCH /api/admin/xp-rules/:id
 *    toggleXpRule        PATCH /api/admin/xp-rules/:id/toggle
 *    resetXpRules        POST  /api/admin/xp-rules/reset
 *
 *  XP LEDGER AUDIT                                              ← NEW
 *    getXpLedger         GET  /api/admin/xp-ledger
 * ─────────────────────────────────────────────────────────────
 */

import asyncHandler         from '../utils/asyncHandler.js';
import User                 from '../models/User.js';
import Activity             from '../models/Activity.js';
import Complaint            from '../models/Complaint.js';
import XpRule, { DEFAULT_XP_RULES } from '../models/XpRule.js';
import XpLedger             from '../models/XpLedger.js';
import { awardXp, bustRuleCache } from '../services/xpEngineService.js';
import { sendNotification } from '../utils/notificationSystem.js';
import { generateQrData }   from '../services/qrService.js';

// ═════════════════════════════════════════════════════════════════════════════
// PLATFORM STATS
// ═════════════════════════════════════════════════════════════════════════════
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalCitizens, totalNgos, totalAuthority,
    totalComplaints, resolvedComplaints, escalatedComplaints,
    totalActivities, openActivities, completedActivities,
    xpAgg, newUsersAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'ngo_admin' }),
    User.countDocuments({ role: 'local_authority' }),
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    Complaint.countDocuments({ status: 'escalated' }),
    Activity.countDocuments(),
    Activity.countDocuments({ status: 'open', adminStatus: 'approved' }),
    Activity.countDocuments({ status: 'completed' }),
    XpLedger.aggregate([{ $group: { _id: null, total: { $sum: '$xp' } } }]),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
  ]);

  const resAgg = await Complaint.aggregate([
    { $match: { resolvedAt: { $exists: true } } },
    { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
    { $group: { _id: null, avg: { $avg: '$diff' } } },
  ]);

  res.json({
    users: {
      total: totalUsers, citizens: totalCitizens,
      ngos: totalNgos, authority: totalAuthority,
      newThisMonth: newUsersAgg,
    },
    complaints: {
      total: totalComplaints, resolved: resolvedComplaints, escalated: escalatedComplaints,
      resolutionRate: totalComplaints ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
      avgResolutionHrs: resAgg[0] ? Math.round(resAgg[0].avg / 3600000) : null,
    },
    activities: { total: totalActivities, open: openActivities, completed: completedActivities },
    xp: { totalDistributed: xpAgg[0]?.total || 0 },
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════
export const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const since = new Date(Date.now() - Number(period) * 86400000);

  const [
    userGrowth, complaintTrend, xpTrend,
    complaintsByStatus, complaintsByCategory,
    xpByAction, topEarners, vibhagBreakdown,
  ] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Complaint.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    XpLedger.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$xp' } } },
      { $sort: { _id: 1 } },
    ]),
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    XpLedger.aggregate([
      { $group: { _id: '$action', total: { $sum: '$xp' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
    User.find().select('name email role xp avatar').sort({ xp: -1 }).limit(10),
    Complaint.aggregate([
      { $match: { vibhag: { $exists: true, $ne: null } } },
      { $group: { _id: '$vibhag', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    period: Number(period),
    userGrowth, complaintTrend, xpTrend,
    complaintsByStatus, complaintsByCategory,
    xpByAction, topEarners, vibhagBreakdown,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20, banned } = req.query;

  const query = {};
  if (role)                 query.role   = role;
  if (banned !== undefined) query.banned = banned === 'true';
  if (search) query.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }

  const [recentXpHistory, xpByAction] = await Promise.all([
    XpLedger.find({ user: user._id }).sort({ createdAt: -1 }).limit(15),
    XpLedger.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$action', total: { $sum: '$xp' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  res.json({ user, recentXpHistory, xpByAction });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const ALLOWED  = ['citizen', 'local_authority', 'ngo_admin', 'super_admin', 'field_worker'];
  if (!ALLOWED.includes(role)) { res.status(400); throw new Error('Invalid role'); }

  const user = await User.findByIdAndUpdate(
    req.params.id, { role }, { new: true, select: '-password' }
  );
  if (!user) { res.status(404); throw new Error('User not found'); }

  await sendNotification(user._id, `Your account role was updated to: ${role}.`, 'info');
  res.json({ message: 'Role updated.', user });
});

export const toggleUserBan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)                       { res.status(404); throw new Error('User not found'); }
  if (user.role === 'super_admin') { res.status(403); throw new Error('Cannot ban a super admin.'); }

  user.banned = !user.banned;
  await user.save();

  const msg = user.banned
    ? 'Your account has been suspended by the platform admin.'
    : 'Your account suspension has been lifted.';
  await sendNotification(user._id, msg, user.banned ? 'error' : 'success');

  res.json({ message: user.banned ? 'User banned.' : 'User unbanned.', banned: user.banned });
});

export const manualAwardXp = asyncHandler(async (req, res) => {
  const { xp, note } = req.body;
  if (!xp || isNaN(Number(xp))) { res.status(400); throw new Error('XP amount is required'); }

  const result = await awardXp(
    req.params.id,
    'admin_manual_award',
    { awardedBy: req.user._id, note: note || 'Manual award by admin' },
    Number(xp)
  );
  if (!result.awarded) { res.status(400); throw new Error(result.reason); }

  await sendNotification(
    req.params.id,
    `🎁 Admin awarded you ${xp} XP${note ? `: "${note}"` : '.'} New total: ${result.newTotal} XP.`,
    'success'
  );

  res.json({ message: `Awarded ${xp} XP.`, ...result });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Revoke (subtract) XP from a user — for abuse/corrections
// @route POST /api/admin/users/:id/revoke-xp
// @access Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const revokeXp = asyncHandler(async (req, res) => {
  const { xp, reason } = req.body;

  if (!xp || isNaN(Number(xp)) || Number(xp) <= 0) {
    res.status(400);
    throw new Error('A positive XP amount to revoke is required.');
  }
  if (!reason || !reason.trim()) {
    res.status(400);
    throw new Error('A reason is required when revoking XP.');
  }

  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found.'); }

  const amount     = Number(xp);
  const prevXp     = user.xp || 0;
  // Floor at 0 — never go negative
  const newXp      = Math.max(0, prevXp - amount);
  const deducted   = prevXp - newXp; // actual amount removed (may be less if near 0)

  user.xp = newXp;
  await user.save();

  // Write a negative ledger entry so history is auditable
  await XpLedger.create({
    user:    user._id,
    action:  'admin_manual_award',          // reuse existing action key
    xp:      -deducted,                     // negative = revoke
    balance: newXp,
    meta: {
      note:       `XP revoked by admin. Reason: ${reason.trim()}`,
      revokedBy:  req.user._id,
      revokedAt:  new Date(),
    },
  });

  await sendNotification(
    user._id,
    `⚠️ ${deducted} XP was removed from your account by an admin. Reason: "${reason.trim()}". New total: ${newXp} XP.`,
    'error'
  );

  res.json({
    message:   `Revoked ${deducted} XP from ${user.name}.`,
    prevXp,
    deducted,
    newTotal:  newXp,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)                       { res.status(404); throw new Error('User not found'); }
  if (user.role === 'super_admin') { res.status(403); throw new Error('Cannot delete a super admin.'); }

  await User.deleteOne({ _id: req.params.id });
  res.json({ message: 'User deleted.' });
});

// ═════════════════════════════════════════════════════════════════════════════
// NGO MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════
export const getAllNgos = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const query = { role: 'ngo_admin' };
  if (status === 'active')    query.banned = false;
  if (status === 'suspended') query.banned = true;
  if (search) query.$or = [
    { name:             { $regex: search, $options: 'i' } },
    { email:            { $regex: search, $options: 'i' } },
    { organizationName: { $regex: search, $options: 'i' } },
  ];

  const ngos = await User.find(query).select('-password').sort({ createdAt: -1 });

  const enriched = await Promise.all(ngos.map(async (ngo) => {
    const [total, completed, pending] = await Promise.all([
      Activity.countDocuments({ ngo: ngo._id }),
      Activity.countDocuments({ ngo: ngo._id, status: 'completed' }),
      Activity.countDocuments({ ngo: ngo._id, adminStatus: 'pending_approval' }),
    ]);
    return { ...ngo.toObject(), activityStats: { total, completed, pendingApproval: pending } };
  }));

  res.json(enriched);
});

export const updateNgoStatus = asyncHandler(async (req, res) => {
  const { action, note } = req.body;

  const ngo = await User.findById(req.params.id);
  if (!ngo || ngo.role !== 'ngo_admin') { res.status(404); throw new Error('NGO not found'); }

  if (!['suspend', 'unsuspend'].includes(action)) {
    res.status(400); throw new Error('action must be suspend or unsuspend');
  }

  ngo.banned = action === 'suspend';
  await ngo.save();

  const msg = ngo.banned
    ? `Your NGO account has been suspended.${note ? ` Reason: ${note}` : ''}`
    : 'Your NGO account has been reinstated.';
  await sendNotification(ngo._id, msg, ngo.banned ? 'error' : 'success');

  res.json({ message: ngo.banned ? 'NGO suspended.' : 'NGO reinstated.', ngo });
});

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVITY APPROVAL QUEUE
// ═════════════════════════════════════════════════════════════════════════════
export const getPendingActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ adminStatus: 'pending_approval' })
    .populate('ngo', 'name email organizationName logo')
    .sort({ createdAt: 1 });
  res.json(activities);
});

export const reviewActivity = asyncHandler(async (req, res) => {
  const { decision, adminNote } = req.body;

  const activity = await Activity.findById(req.params.id).populate('ngo', 'name email _id');
  if (!activity) { res.status(404); throw new Error('Activity not found'); }
  if (activity.adminStatus !== 'pending_approval') {
    res.status(400); throw new Error('Activity already reviewed.');
  }

  if (decision === 'rejected') {
    Object.assign(activity, {
      adminStatus: 'rejected', adminNote: adminNote || 'Rejected by admin.', status: 'draft',
    });
    await activity.save();
    await sendNotification(activity.ngo._id,
      `Mission "${activity.title}" was rejected. Reason: ${activity.adminNote}`,
      'error', activity._id);
    return res.json({ message: 'Activity rejected.', activity });
  }

  if (decision !== 'approved') {
    res.status(400); throw new Error('"decision" must be "approved" or "rejected"');
  }

  const { token, payload, expiresAt, dataUrl } = await generateQrData(
    activity._id.toString(),
    activity.location.lat,
    activity.location.lng,
    activity.date
  );

  Object.assign(activity, {
    adminStatus: 'approved', adminNote: adminNote || '', status: 'open',
    approvedBy: req.user._id, approvedAt: new Date(),
    qr: { token, payload, expiresAt, isActive: true, generatedAt: new Date() },
  });
  await activity.save();

  await awardXp(activity.ngo._id, 'ngo_create_mission', { activityId: activity._id });
  await sendNotification(activity.ngo._id,
    `🎉 Mission "${activity.title}" approved! QR ready in your dashboard.`,
    'success', activity._id);

  res.json({ message: 'Activity approved, QR generated.', activity, qrDataUrl: dataUrl });
});

// ═════════════════════════════════════════════════════════════════════════════
// COMPLAINT OVERSIGHT
// ═════════════════════════════════════════════════════════════════════════════
export const getAllComplaintsAdmin = asyncHandler(async (req, res) => {
  const { status, vibhag, page = 1, limit = 20, search } = req.query;

  const query = {};
  if (status) query.status = status;
  if (vibhag) query.vibhag = vibhag;
  if (search) query.$or = [
    { ticketId: { $regex: search, $options: 'i' } },
    { title:    { $regex: search, $options: 'i' } },
  ];

  const [complaints, total] = await Promise.all([
    Complaint.find(query).populate('user', 'name email')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    Complaint.countDocuments(query),
  ]);

  res.json({ complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX: award complaint_resolved XP to citizen when admin forces status to
//      'resolved'. Previously the citizen never received XP in this path.
// ─────────────────────────────────────────────────────────────────────────────
export const forceComplaintStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const VALID = ['pending','under_review','officer_assigned','in_progress','resolved','closed','escalated','rejected'];
  if (!VALID.includes(status)) { res.status(400); throw new Error('Invalid status'); }

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status, ...(status === 'resolved' ? { resolvedAt: new Date() } : {}) },
    { new: true }
  ).populate('user', 'name _id');
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  // ── FIX: award XP to citizen when admin force-resolves ───────────────────
  if (status === 'resolved') {
    await awardXp(
      complaint.user._id,
      'complaint_resolved',
      { complaintId: complaint._id, resolvedBy: 'admin', adminId: req.user._id }
    );
  }

  await sendNotification(
    complaint.user._id,
    `Admin update on ${complaint.ticketId}: status changed to "${status}".${note ? ` Note: ${note}` : ''}`,
    'info'
  );

  res.json({ message: 'Status updated.', complaint });
});

// ═════════════════════════════════════════════════════════════════════════════
// XP RULE ENGINE
// ═════════════════════════════════════════════════════════════════════════════
export const getXpRules = asyncHandler(async (req, res) => {
  const rules = await XpRule.find().sort({ category: 1, action: 1 });
  res.json(rules);
});

export const updateXpRule = asyncHandler(async (req, res) => {
  const { xp, cooldownHrs, maxPerDay, label, description } = req.body;

  const updates = {
    ...(xp          !== undefined && { xp: Number(xp) }),
    ...(cooldownHrs !== undefined && { cooldownHrs: Number(cooldownHrs) }),
    ...(maxPerDay   !== undefined && { maxPerDay: Number(maxPerDay) }),
    ...(label       !== undefined && { label }),
    ...(description !== undefined && { description }),
    lastUpdatedBy: req.user._id,
  };

  const rule = await XpRule.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!rule) { res.status(404); throw new Error('XP Rule not found'); }

  bustRuleCache();
  res.json({ message: 'Rule updated.', rule });
});

export const toggleXpRule = asyncHandler(async (req, res) => {
  const rule = await XpRule.findById(req.params.id);
  if (!rule) { res.status(404); throw new Error('XP Rule not found'); }

  rule.enabled       = !rule.enabled;
  rule.lastUpdatedBy = req.user._id;
  await rule.save();

  bustRuleCache();
  res.json({ message: `Rule "${rule.label}" ${rule.enabled ? 'enabled' : 'disabled'}.`, rule });
});

export const resetXpRules = asyncHandler(async (req, res) => {
  await XpRule.deleteMany({});
  await XpRule.insertMany(DEFAULT_XP_RULES);
  bustRuleCache();
  res.json({ message: `XP rules reset to ${DEFAULT_XP_RULES.length} defaults.` });
});

// ═════════════════════════════════════════════════════════════════════════════
// XP LEDGER AUDIT                                                         ← NEW
// ═════════════════════════════════════════════════════════════════════════════
// @desc  Global XP ledger with filters — for auditing XP farming / abuse
// @route GET /api/admin/xp-ledger?userId=&action=&page=1&limit=50&from=&to=
// @access Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getXpLedger = asyncHandler(async (req, res) => {
  const { userId, action, page = 1, limit = 50, from, to } = req.query;

  const query = {};
  if (userId) query.user   = userId;
  if (action) query.action = action;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to)   query.createdAt.$lte = new Date(to);
  }

  const [entries, total] = await Promise.all([
    XpLedger.find(query)
      .populate('user', 'name email role')   // show who earned it
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    XpLedger.countDocuments(query),
  ]);

  // Aggregate summary for the current filter set
  const summary = await XpLedger.aggregate([
    { $match: query },
    {
      $group: {
        _id:        null,
        totalXp:    { $sum: '$xp' },
        totalGiven: { $sum: { $cond: [{ $gt: ['$xp', 0] }, '$xp', 0] } },
        totalTaken: { $sum: { $cond: [{ $lt: ['$xp', 0] }, '$xp', 0] } },
        count:      { $sum: 1 },
      },
    },
  ]);

  res.json({
    entries,
    total,
    page:    Number(page),
    pages:   Math.ceil(total / Number(limit)),
    summary: summary[0] || { totalXp: 0, totalGiven: 0, totalTaken: 0, count: 0 },
  });
});
