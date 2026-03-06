import asyncHandler from '../utils/asyncHandler.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import gamificationService from '../services/gamificationService.js'; // <-- NEW IMPORT
import { sendNotification } from '../utils/notificationSystem.js';

// @desc    Create a new activity
// @route   POST /api/activities
const createActivity = asyncHandler(async (req, res) => {
  const { 
    title, description, category, pointsReward, 
    date, deadline, location: locationString, 
    maxParticipants, requirements, contactInfo 
  } = req.body;

  // 1. Robust Location Parsing
  let location;
  if (locationString) {
    try {
      location = typeof locationString === 'string' ? JSON.parse(locationString) : locationString;
    } catch (e) {
      location = { name: locationString };
    }
  }

  // 2. Requirements Parsing
  let parsedRequirements = requirements;
  if (typeof requirements === 'string') {
    try {
      parsedRequirements = JSON.parse(requirements);
    } catch (e) {
      parsedRequirements = requirements.split(',').map(r => r.trim());
    }
  }

  // 3. Handle Image from Multer
  const banner = req.file ? req.file.path : undefined;

  // 4. Validate dates
  if (new Date(deadline) > new Date(date)) {
    res.status(400);
    throw new Error('Registration deadline cannot be after the mission date.');
  }

  const activity = await Activity.create({
    ngo: req.user._id,
    title,
    description,
    banner,
    category,
    pointsReward: Number(pointsReward),
    date,
    deadline,
    location,
    maxParticipants: Number(maxParticipants),
    requirements: parsedRequirements,
    contactInfo,
    status: 'open'
  });

  // --- Notify NGO of successful deployment ---
  await sendNotification(
    req.user._id,
    `Mission Deployed: "${title}" is now live and accepting volunteers!`,
    'success',
    activity._id
  );

  res.status(201).json(activity);
});

// @desc    Update existing activity
// @route   PUT /api/activities/:id
const updateActivity = asyncHandler(async (req, res) => {
  let activity = await Activity.findById(req.params.id);

  if (!activity) {
    res.status(404);
    throw new Error('Mission not found');
  }

  // Check Ownership
  if (activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to update this mission');
  }

  const { location: locationString, requirements, ...rest } = req.body;

  // 1. Location Update Logic
  let updatedLocation;
  if (locationString) {
    try {
      updatedLocation = typeof locationString === 'string' ? JSON.parse(locationString) : locationString;
    } catch (e) {
      updatedLocation = { name: locationString };
    }
  }

  // 2. Requirements Update Logic
  let updatedRequirements = requirements;
  if (typeof requirements === 'string') {
    try {
      updatedRequirements = JSON.parse(requirements);
    } catch (e) {
      updatedRequirements = requirements.split(',').map(r => r.trim());
    }
  }

  // 3. Handle Banner Update
  if (req.file) {
    rest.banner = req.file.path;
  }

  // Update fields
  const updatedData = {
    ...rest,
    location: updatedLocation || activity.location,
    requirements: updatedRequirements || activity.requirements,
  };

  const updatedActivity = await Activity.findByIdAndUpdate(
    req.params.id,
    updatedData,
    { new: true, runValidators: true }
  );

  // --- Notify Enlisted Citizens of changes ---
  if (updatedActivity.participants && updatedActivity.participants.length > 0) {
    const participantIds = updatedActivity.participants.map(p => p.user);
    
    // Dispatch notifications to all enrolled users about the update
    for (const userId of participantIds) {
      await sendNotification(
        userId,
        `Mission Alert: Details for "${updatedActivity.title}" have been updated by the NGO. Please check the briefing.`,
        'info',
        updatedActivity._id
      );
    }
  }

  // Notify the NGO admin that updates were saved
  await sendNotification(
    req.user._id,
    `Changes saved for mission: "${updatedActivity.title}". Volunteers have been notified.`,
    'success',
    updatedActivity._id
  );

  res.json(updatedActivity);
});

// @desc    Get all activities (Optimized)
// @route   GET /api/activities
const getAllActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ 
    status: 'open',
    date: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) } 
  })
    .populate('ngo', 'name organizationName logo') 
    .sort({ date: 1 });
    
  res.json(activities);
});

// @desc    Get single activity by ID
// @route   GET /api/activities/:id
const getActivityById = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id).populate('ngo', 'name email organizationName logo');
  
  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  res.json(activity);
});

// @desc    Get pending approvals for NGO
// @route   GET /api/activities/pending-approvals
const getPendingApprovals = asyncHandler(async (req, res) => {
  const ngoId = req.user._id;

  const activities = await Activity.find({ 
    ngo: ngoId, 
    'participants.status': 'pending' 
  }).populate('participants.user', 'name email avatar');

  const pendingClaims = [];
  activities.forEach(activity => {
    activity.participants.forEach(p => {
      if (p.status === 'pending') {
        pendingClaims.push({
          _id: p._id,
          activityId: activity._id,
          activityTitle: activity.title,
          points: activity.pointsReward,
          user: p.user,
          joinedAt: p.joinedAt
        });
      }
    });
  });

  res.json(pendingClaims);
});

// @desc    User joins an activity (Enlist)
// @route   POST /api/activities/:id/claim
const requestCompletion = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  if (new Date() > new Date(activity.deadline)) {
    res.status(400);
    throw new Error('Registration for this mission has closed.');
  }

  const activeParticipants = activity.participants.filter(p => p.status !== 'rejected');
  if (activeParticipants.length >= activity.maxParticipants) {
    res.status(400);
    throw new Error('Mission is at full capacity.');
  }

  const existingParticipant = activity.participants.find(
    (p) => p.user.toString() === req.user._id.toString()
  );

  if (existingParticipant) {
    if (existingParticipant.status === 'pending') throw new Error('Already applied.');
    if (existingParticipant.status === 'approved') throw new Error('Already completed.');
    existingParticipant.status = 'pending';
    existingParticipant.joinedAt = Date.now();
  } else {
    activity.participants.push({ user: req.user._id, status: 'pending' });
  }

  await activity.save();

  // --- Notify both Citizen and NGO of enlistment ---
  await sendNotification(
    req.user._id,
    `Enlisted successfully! You are now scheduled for "${activity.title}".`,
    'info',
    activity._id
  );

  await sendNotification(
    activity.ngo,
    `New Volunteer! A citizen has enlisted for "${activity.title}".`,
    'info',
    activity._id
  );

  res.json({ message: 'Successfully enlisted!' });
});

// @desc    Verify completion
// @route   PUT /api/activities/:id/verify
const verifyCompletion = asyncHandler(async (req, res) => {
  const { userId, status } = req.body; 
  const activity = await Activity.findById(req.params.id);

  if (!activity || activity.ngo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Unauthorized or not found');
  }

  const participant = activity.participants.find((p) => p.user.toString() === userId);

  if (!participant || participant.status !== 'pending') {
    res.status(400);
    throw new Error('No pending request found.');
  }

  participant.status = status;
  await activity.save();

  // --- NEW: Custom Gamification Logic ---
  if (status === 'approved') {
    const customXP = activity.pointsReward; 

    // Award Points using new Gamification Service
    const gamificationResult = await gamificationService.awardPoints(
      userId, 
      customXP, 
      `Mission Accomplished: ${activity.title}`
    );

    // Dynamic Notification (Appends Level Up message if applicable)
    let notificationMsg = `Bravo! You earned ${customXP} XP for completing ${activity.title}.`;
    if (gamificationResult.leveledUp) {
      notificationMsg += ` 🎉 You leveled up to ${gamificationResult.currentLevel}!`;
    }

    await sendNotification(userId, notificationMsg, 'success', activity._id);
    
    res.json({ 
      message: 'Approved!', 
      gamification: gamificationResult 
    });
  } else {
    await sendNotification(
      userId, 
      `Update: Your attendance claim for ${activity.title} was declined.`, 
      'error', 
      activity._id
    );
    res.json({ message: 'Declined.' });
  }
});

export { 
  createActivity, 
  updateActivity,
  getAllActivities, 
  getActivityById,
  getPendingApprovals, 
  requestCompletion, 
  verifyCompletion 
};