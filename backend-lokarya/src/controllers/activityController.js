/**
 * activityController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 7-Step QR Attendance Flow:
 *
 * Step 1 — NGO Creates Activity            createActivity
 * Step 2 — Admin Approves + QR Generated   approveActivity  (super_admin only)
 * Step 3 — Citizen Registers               registerForActivity
 * Step 4+5 — Citizen Scans QR at Venue     scanQr  (3-layer gate inside)
 * Step 6 — NGO Ends Event + Review         endEvent, markAbsent, gpsOverride
 * Step 7 — Points Credited                 distributePoints  (called inside endEvent)
 *
 * Legacy helpers still exported for backward-compat:
 *   getAllActivities, getActivityById, getPendingApprovals, updateActivity
 */

import asyncHandler         from '../utils/asyncHandler.js';
import Activity             from '../models/Activity.js';
import User                 from '../models/User.js';
import { awardXp }          from '../services/xpEngineService.js'; // ✅ NEW — replaces gamificationService
import { sendNotification } from '../utils/notificationSystem.js';
import { generateQrData, verifyQrPayload, haversineDistance } from '../services/qrService.js';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — NGO Creates Activity
// POST /api/activities
// ─────────────────────────────────────────────────────────────────────────────
export const createActivity = asyncHandler(async (req, res) => {
  const {
    title, description, category, pointsReward,
    date, deadline, location: locationRaw,
    maxParticipants, requirements, contactInfo,
    bonusConfig,
    gpsRadiusMeters,
  } = req.body;

  // Parse location — must include lat/lng for QR GPS gate
  let location;
  try {
    location = typeof locationRaw === 'string' ? JSON.parse(locationRaw) : locationRaw;
  } catch {
    location = { name: locationRaw };
  }

  if (!location?.lat || !location?.lng) {
    res.status(400);
    throw new Error('location.lat and location.lng are required for QR-based attendance.');
  }

  // Parse requirements
  let parsedRequirements = requirements;
  if (typeof requirements === 'string') {
    try { parsedRequirements = JSON.parse(requirements); }
    catch { parsedRequirements = requirements.split(',').map(r => r.trim()); }
  }

  // Parse bonusConfig
  let parsedBonus;
  if (bonusConfig) {
    try { parsedBonus = typeof bonusConfig === 'string' ? JSON.parse(bonusConfig) : bonusConfig; }
    catch { parsedBonus = undefined; }
  }

  if (new Date(deadline) > new Date(date)) {
    res.status(400);
    throw new Error('Registration deadline cannot be after the mission date.');
  }

  const activity = await Activity.create({
    ngo:             req.user._id,
    title,
    description,
    banner:          req.file ? req.file.path : undefined,
    category,
    pointsReward:    Number(pointsReward),
    date,
    deadline,
    location,
    maxParticipants: Number(maxParticipants),
    requirements:    parsedRequirements,
    contactInfo,
    gpsRadiusMeters: gpsRadiusMeters ? Number(gpsRadiusMeters) : 300,
    bonusConfig:     parsedBonus,
    adminStatus:     'pending_approval',
    status:          'draft',
  });

  await sendNotification(
    req.user._id,
    `Mission "${title}" submitted for admin approval.`,
    'info',
    activity._id
  );

  res.status(201).json(activity);
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Admin Approves + QR Auto-Generated
// PATCH /api/activities/:id/approve   (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const approveActivity = asyncHandler(async (req, res) => {
  const { decision, adminNote } = req.body; // decision: 'approved' | 'rejected'

  const activity = await Activity.findById(req.params.id).populate('ngo', 'name email');
  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (activity.adminStatus !== 'pending_approval') {
    res.status(400);
    throw new Error('Activity already reviewed.');
  }

  if (decision === 'rejected') {
    activity.adminStatus = 'rejected';
    activity.adminNote   = adminNote || 'Rejected by admin.';
    await activity.save();

    await sendNotification(
      activity.ngo._id,
      `Your mission "${activity.title}" was rejected. Reason: ${activity.adminNote}`,
      'error',
      activity._id
    );

    return res.json({ message: 'Activity rejected.', activity });
  }

  // ── APPROVED: generate QR ─────────────────────────────────────────────────
  const { token, payload, expiresAt, dataUrl } = await generateQrData(
    activity._id.toString(),
    activity.location.lat,
    activity.location.lng,
    activity.date
  );

  activity.adminStatus = 'approved';
  activity.adminNote   = adminNote || '';
  activity.approvedBy  = req.user._id;
  activity.approvedAt  = new Date();
  activity.status      = 'open';
  activity.qr          = { token, payload, expiresAt, isActive: true, generatedAt: new Date() };

  await activity.save();

  await sendNotification(
    activity.ngo._id,
    `🎉 Mission "${activity.title}" approved! QR code generated — share it with your team.`,
    'success',
    activity._id
  );

  res.json({
    message:    'Activity approved and QR generated.',
    activity,
    qrDataUrl:  dataUrl,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 2b — Regenerate QR
// POST /api/activities/:id/regenerate-qr
// ─────────────────────────────────────────────────────────────────────────────
export const regenerateQr = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the NGO that owns this activity can regenerate the QR.');
  }

  if (activity.adminStatus !== 'approved') {
    res.status(400);
    throw new Error('Activity must be approved before generating QR.');
  }

  const { token, payload, expiresAt, dataUrl } = await generateQrData(
    activity._id.toString(),
    activity.location.lat,
    activity.location.lng,
    activity.date
  );

  activity.qr = { token, payload, expiresAt, isActive: true, generatedAt: new Date() };
  await activity.save();

  res.json({ message: 'QR regenerated.', qrDataUrl: dataUrl });
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Citizen Registers
// POST /api/activities/:id/register
// ─────────────────────────────────────────────────────────────────────────────
export const registerForActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (activity.adminStatus !== 'approved') {
    res.status(400);
    throw new Error('This mission is not yet approved.');
  }

  if (activity.status !== 'open') {
    res.status(400);
    throw new Error('Registration is closed for this mission.');
  }

  if (new Date() > new Date(activity.deadline)) {
    res.status(400);
    throw new Error('Registration deadline has passed.');
  }

  const registered = activity.attendance.filter(a => a.registrationStatus === 'registered');
  if (registered.length >= activity.maxParticipants) {
    res.status(400);
    throw new Error('Mission is at full capacity.');
  }

  const existing = activity.attendance.find(
    a => a.user.toString() === req.user._id.toString()
  );
  if (existing) {
    if (existing.registrationStatus === 'registered') {
      throw new Error('You are already registered for this mission.');
    }
    existing.registrationStatus = 'registered';
    existing.registeredAt       = new Date();
    existing.finalStatus        = 'pending';
  } else {
    activity.attendance.push({
      user:               req.user._id,
      registrationStatus: 'registered',
      finalStatus:        'pending',
    });
  }

  const alreadyInLegacy = activity.participants.find(
    p => p.user.toString() === req.user._id.toString()
  );
  if (!alreadyInLegacy) {
    activity.participants.push({ user: req.user._id, status: 'pending' });
  }

  await activity.save();

  await sendNotification(
    req.user._id,
    `✅ Registered for "${activity.title}" on ${new Date(activity.date).toDateString()}! Show up and scan the QR to earn ${activity.pointsReward} XP.`,
    'success',
    activity._id
  );

  await sendNotification(
    activity.ngo,
    `New volunteer registered for "${activity.title}".`,
    'info',
    activity._id
  );

  res.json({ message: 'Successfully registered! You will receive a confirmation shortly.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 + 5 — Citizen Scans QR at Venue
// POST /api/activities/scan-qr
// ─────────────────────────────────────────────────────────────────────────────
export const scanQr = asyncHandler(async (req, res) => {
  const { payload, userLat, userLng } = req.body;

  if (!payload) {
    res.status(400);
    throw new Error('QR payload is required.');
  }

  const qrResult = verifyQrPayload(payload);
  if (!qrResult.valid) {
    res.status(400);
    throw new Error(`QR Verification Failed (Layer 1): ${qrResult.error}`);
  }

  const activity = await Activity.findById(qrResult.activityId);
  if (!activity) { res.status(404); throw new Error('Activity not found.'); }

  if (!activity.qr?.isActive) {
    res.status(400);
    throw new Error('QR for this activity is no longer active.');
  }

  if (activity.qr.token !== qrResult.token) {
    res.status(400);
    throw new Error('QR token mismatch. Please contact the NGO organiser.');
  }

  const attendee = activity.attendance.find(
    a => a.user.toString() === req.user._id.toString()
  );
  if (!attendee || attendee.registrationStatus !== 'registered') {
    res.status(403);
    throw new Error('You are not registered for this mission. Please register first.');
  }

  if (attendee.scannedAt) {
    return res.status(409).json({
      success:   false,
      layer:     3,
      message:   'You have already scanned the QR for this mission.',
      scannedAt: attendee.scannedAt,
    });
  }

  let gpsVerified       = false;
  let gpsDistanceMeters = null;
  const gpsAvailable    = userLat != null && userLng != null;

  if (gpsAvailable) {
    gpsDistanceMeters = haversineDistance(
      userLat, userLng,
      qrResult.venueLat, qrResult.venueLng
    );
    gpsVerified = gpsDistanceMeters <= (activity.gpsRadiusMeters || 300);
  }

  attendee.scannedAt         = new Date();
  attendee.scanGps           = gpsAvailable ? { lat: userLat, lng: userLng } : undefined;
  attendee.gpsDistanceMeters = gpsDistanceMeters;
  attendee.gpsVerified       = gpsVerified;

  await activity.save();

  if (gpsAvailable && !gpsVerified) {
    await sendNotification(
      activity.ngo,
      `⚠️ GPS mismatch for "${req.user.name}" at "${activity.title}". Distance: ${Math.round(gpsDistanceMeters)}m. Manual override available in your dashboard.`,
      'warning',
      activity._id
    );

    return res.json({
      success:  false,
      layer:    2,
      message:  'GPS verification failed. You appear to be outside the venue radius. The NGO organiser has been notified and can manually confirm your attendance.',
      distance: Math.round(gpsDistanceMeters),
      radius:   activity.gpsRadiusMeters,
    });
  }

  if (!gpsAvailable) {
    await sendNotification(
      activity.ngo,
      `⚠️ "${req.user.name}" scanned QR for "${activity.title}" but GPS was unavailable. Manual confirmation may be needed.`,
      'warning',
      activity._id
    );
  }

  await sendNotification(
    req.user._id,
    `📍 Attendance recorded for "${activity.title}"! Points will be credited after the NGO closes the event.`,
    'success',
    activity._id
  );

  res.json({
    success:      true,
    message:      gpsAvailable
      ? `✅ Attendance verified! You're ${Math.round(gpsDistanceMeters)}m from the venue.`
      : '✅ QR scanned! GPS unavailable — the organiser may verify manually.',
    gpsVerified,
    distance:     gpsDistanceMeters ? Math.round(gpsDistanceMeters) : null,
    pointsPending: activity.pointsReward,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5b — GPS Override
// PATCH /api/activities/:id/gps-override
// ─────────────────────────────────────────────────────────────────────────────
export const gpsOverride = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the NGO organiser can override GPS.');
  }

  const attendee = activity.attendance.find(a => a.user.toString() === userId);
  if (!attendee) {
    res.status(404);
    throw new Error('Attendee not found in this activity.');
  }

  attendee.gpsOverride = true;
  attendee.gpsVerified = true;
  await activity.save();

  await sendNotification(
    userId,
    `✅ Your attendance at "${activity.title}" has been manually confirmed by the organiser.`,
    'success',
    activity._id
  );

  res.json({ message: 'GPS override applied. Attendee is now verified.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — NGO Ends Event
// POST /api/activities/:id/end-event
// ─────────────────────────────────────────────────────────────────────────────
export const endEvent = asyncHandler(async (req, res) => {
  const { absentUserIds = [] } = req.body;

  const activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the NGO organiser can end this event.');
  }

  if (activity.status === 'completed') {
    res.status(400);
    throw new Error('Event already completed.');
  }

  if (activity.qr) activity.qr.isActive = false;

  for (const attendee of activity.attendance) {
    if (attendee.registrationStatus !== 'registered') continue;

    if (absentUserIds.includes(attendee.user.toString())) {
      attendee.finalStatus = 'absent';
    } else if (attendee.scannedAt && (attendee.gpsVerified || attendee.gpsOverride)) {
      attendee.finalStatus = 'present';
    } else {
      attendee.finalStatus = 'absent';
    }
  }

  activity.status  = 'ended';
  activity.endedAt = new Date();
  activity.endedBy = req.user._id;
  await activity.save();

  const result = await _distributePoints(activity);

  activity.status              = 'completed';
  activity.pointsDistributedAt = new Date();
  await activity.save();

  // Sync legacy participants
  for (const attendee of activity.attendance) {
    const legacy = activity.participants.find(
      p => p.user.toString() === attendee.user.toString()
    );
    if (legacy) {
      legacy.status = attendee.finalStatus === 'present' ? 'approved' : 'rejected';
    }
  }
  await activity.save();

  // Award NGO XP for completing a mission
  await awardXp(activity.ngo, 'ngo_mission_completed', { activityId: activity._id });

  await sendNotification(
    req.user._id,
    `🏁 Event "${activity.title}" closed. ${result.credited} volunteers credited with XP.`,
    'success',
    activity._id
  );

  res.json({
    message:           'Event ended and points distributed.',
    pointsDistributed: result.credited,
    absent:            result.absent,
    summary:           result.summary,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — Internal: Distribute Points with Bonuses
// ─────────────────────────────────────────────────────────────────────────────
async function _distributePoints(activity) {
  const cfg          = activity.bonusConfig || {};
  const earlyBirdMul = cfg.earlyBirdMultiplier || 1.2;
  const streakBonus  = cfg.streakBonus         || 10;
  const friendBonus  = cfg.bringAFriendBonus   || 15;
  const base         = activity.pointsReward;

  const presentAttendees = activity.attendance.filter(a => a.finalStatus === 'present');
  const presentUserIds   = new Set(presentAttendees.map(a => a.user.toString()));

  let credited = 0;
  let absent   = 0;
  const summary = [];

  for (const attendee of activity.attendance) {
    if (attendee.finalStatus !== 'present') {
      absent++;
      await sendNotification(
        attendee.user,
        `You were marked absent for "${activity.title}". No XP awarded.`,
        'error',
        activity._id
      );
      continue;
    }

    const user = await User.findById(attendee.user);
    if (!user) continue;

    let bonus = 0;
    const breakdown = { earlyBird: 0, streak: 0, bringAFriend: 0 };

    // Bonus 1: Early Bird
    const hoursAfterPost = (new Date(attendee.registeredAt) - new Date(activity.createdAt)) / 3600000;
    if (hoursAfterPost <= 24) {
      const eb = Math.round(base * (earlyBirdMul - 1));
      breakdown.earlyBird = eb;
      bonus += eb;
    }

    // Bonus 2: Streak
    const streakLevel = await _getUserStreakLevel(user._id, activity._id);
    if (streakLevel > 1) {
      const sb = streakBonus * Math.min(streakLevel - 1, 5);
      breakdown.streak = sb;
      bonus += sb;
    }

    // Bonus 3: Bring-a-friend
    if (user.referredUsers?.length > 0) {
      const friendAttended = user.referredUsers.some(fId => presentUserIds.has(fId.toString()));
      if (friendAttended) {
        breakdown.bringAFriend = friendBonus;
        bonus += friendBonus;
      }
    }

    const total = base + bonus;

    // ✅ NEW: award via xpEngineService with override for custom activity point value
    const xpResult = await awardXp(
      attendee.user,
      'attend_ngo_activity',
      { activityId: activity._id, note: `Mission: ${activity.title}` },
      total  // override the rule's default XP with the activity's actual reward
    );

    attendee.pointsCredited = true;
    attendee.basePoints     = base;
    attendee.bonusPoints    = bonus;
    attendee.bonusBreakdown = breakdown;
    attendee.totalPoints    = total;

    let msg = `🏆 +${total} XP earned for "${activity.title}"!`;
    if (bonus > 0) {
      const parts = [];
      if (breakdown.earlyBird)    parts.push(`Early Bird +${breakdown.earlyBird}`);
      if (breakdown.streak)       parts.push(`Streak +${breakdown.streak}`);
      if (breakdown.bringAFriend) parts.push(`Friend Bonus +${breakdown.bringAFriend}`);
      msg += ` (${parts.join(', ')})`;
    }
    if (xpResult.leveledUp) {
      msg += ` 🎉 You ranked up to ${xpResult.currentLevel}!`;
    }

    await sendNotification(attendee.user, msg, 'success', activity._id);

    summary.push({ userId: attendee.user, base, bonus, total, breakdown });
    credited++;
  }

  return { credited, absent, summary };
}

// Helper: count consecutive completed activities for streak
async function _getUserStreakLevel(userId, excludeActivityId) {
  const recentCompleted = await Activity.find({
    'attendance.user':        userId,
    'attendance.finalStatus': 'present',
    status:                   'completed',
    _id:                      { $ne: excludeActivityId },
  })
    .sort({ date: -1 })
    .limit(5)
    .select('date');

  return recentCompleted.length + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// NGO DASHBOARD — Get attendance list
// GET /api/activities/:id/attendance
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceList = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
    .populate('attendance.user', 'name email avatar phone');

  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (
    activity.ngo.toString() !== req.user._id.toString() &&
    req.user.role !== 'super_admin'
  ) {
    res.status(403);
    throw new Error('Unauthorized.');
  }

  res.json({
    activity: { _id: activity._id, title: activity.title, date: activity.date, status: activity.status },
    attendance: activity.attendance.map(a => ({
      user:               a.user,
      registrationStatus: a.registrationStatus,
      registeredAt:       a.registeredAt,
      scannedAt:          a.scannedAt,
      gpsVerified:        a.gpsVerified,
      gpsOverride:        a.gpsOverride,
      gpsDistanceMeters:  a.gpsDistanceMeters,
      finalStatus:        a.finalStatus,
      pointsCredited:     a.pointsCredited,
      totalPoints:        a.totalPoints,
      bonusBreakdown:     a.bonusBreakdown,
    })),
    qrActive: activity.isQrActive,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NGO DASHBOARD — Get QR data URL
// GET /api/activities/:id/qr
// ─────────────────────────────────────────────────────────────────────────────
export const getQrCode = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404); throw new Error('Activity not found'); }

  if (
    activity.ngo.toString() !== req.user._id.toString() &&
    req.user.role !== 'super_admin'
  ) {
    res.status(403);
    throw new Error('Unauthorized.');
  }

  if (!activity.qr?.payload) {
    res.status(404);
    throw new Error('QR not generated yet. Activity may be pending admin approval.');
  }

  const QRCode = await import('qrcode');
  const dataUrl = await QRCode.default.toDataURL(activity.qr.payload, {
    errorCorrectionLevel: 'H',
    width:  400,
    margin: 2,
    color:  { dark: '#0f2c4a', light: '#ffffff' },
  });

  res.json({
    dataUrl,
    expiresAt: activity.qr.expiresAt,
    isActive:  activity.isQrActive,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Get all activities pending approval
// GET /api/activities/admin/pending
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminPendingActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ adminStatus: 'pending_approval' })
    .populate('ngo', 'name email organizationName logo')
    .sort({ createdAt: 1 });

  res.json(activities);
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Get all open activities
// GET /api/activities
// ─────────────────────────────────────────────────────────────────────────────
export const getAllActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({
    adminStatus: 'approved',
    status:      { $in: ['open', 'ongoing'] },
    date:        { $gte: new Date(Date.now() - 86400000) },
  })
    .populate('ngo', 'name organizationName logo')
    .sort({ date: 1 });

  res.json(activities);
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Get single activity
// GET /api/activities/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getActivityById = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
    .populate('ngo', 'name email organizationName logo');

  if (!activity) { res.status(404); throw new Error('Activity not found'); }
  res.json(activity);
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — NGO pending approvals
// GET /api/activities/pending-approvals
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const activities = await Activity.find({
    ngo:                   req.user._id,
    'participants.status': 'pending',
  }).populate('participants.user', 'name email avatar');

  const pendingClaims = [];
  activities.forEach(activity => {
    activity.participants.forEach(p => {
      if (p.status === 'pending') {
        pendingClaims.push({
          _id:           p._id,
          activityId:    activity._id,
          activityTitle: activity.title,
          points:        activity.pointsReward,
          user:          p.user,
          joinedAt:      p.joinedAt,
        });
      }
    });
  });
  res.json(pendingClaims);
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Update activity
// PUT /api/activities/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateActivity = asyncHandler(async (req, res) => {
  let activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404); throw new Error('Mission not found'); }

  if (activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized');
  }

  const { location: locationRaw, requirements, ...rest } = req.body;

  let updatedLocation;
  if (locationRaw) {
    try { updatedLocation = typeof locationRaw === 'string' ? JSON.parse(locationRaw) : locationRaw; }
    catch { updatedLocation = { name: locationRaw }; }
  }

  let updatedRequirements = requirements;
  if (typeof requirements === 'string') {
    try { updatedRequirements = JSON.parse(requirements); }
    catch { updatedRequirements = requirements.split(',').map(r => r.trim()); }
  }

  if (req.file) rest.banner = req.file.path;

  const updated = await Activity.findByIdAndUpdate(
    req.params.id,
    {
      ...rest,
      location:     updatedLocation     || activity.location,
      requirements: updatedRequirements || activity.requirements,
    },
    { new: true, runValidators: true }
  );

  if (updated.participants?.length > 0) {
    for (const p of updated.participants) {
      await sendNotification(p.user, `Mission "${updated.title}" details updated.`, 'info', updated._id);
    }
  }

  res.json(updated);
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — requestCompletion → redirects to register
// POST /api/activities/:id/claim
// ─────────────────────────────────────────────────────────────────────────────
export const requestCompletion = asyncHandler(async (req, res) => {
  req.url = `/api/activities/${req.params.id}/register`;
  return registerForActivity(req, res);
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — verifyCompletion (old NGO verify flow)
// PUT /api/activities/:id/verify
// ─────────────────────────────────────────────────────────────────────────────
export const verifyCompletion = asyncHandler(async (req, res) => {
  const { userId, status } = req.body;
  const activity = await Activity.findById(req.params.id);

  if (!activity || activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized or not found');
  }

  const participant = activity.participants.find(p => p.user.toString() === userId);
  if (!participant || participant.status !== 'pending') {
    res.status(400);
    throw new Error('No pending request found.');
  }

  participant.status = status;
  await activity.save();

  if (status === 'approved') {
    // ✅ NEW: use xpEngineService with override for the activity's reward value
    const xpResult = await awardXp(
      userId,
      'attend_ngo_activity',
      { activityId: activity._id, note: `Mission Accomplished: ${activity.title}` },
      activity.pointsReward
    );

    let msg = `Bravo! +${activity.pointsReward} XP for ${activity.title}.`;
    if (xpResult.leveledUp) msg += ` 🎉 Ranked up to ${xpResult.currentLevel}!`;
    await sendNotification(userId, msg, 'success', activity._id);
    res.json({ message: 'Approved!', xp: xpResult });
  } else {
    await sendNotification(userId, `Claim for "${activity.title}" declined.`, 'error', activity._id);
    res.json({ message: 'Declined.' });
  }
});
