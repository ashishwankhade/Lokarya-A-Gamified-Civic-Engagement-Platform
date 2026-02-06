import  asyncHandler  from '../utils/asyncHandler.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { awardPoints } from '../utils/gamificationEngine.js';
import { sendNotification } from '../utils/notificationSystem.js';

// @desc    Create a new activity (With Image & Logistics)
// @route   POST /api/activities
const createActivity = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    category,
    pointsReward, 
    date, 
    deadline,
    location: locationString, 
    maxParticipants,
    requirements, 
    contactInfo
  } = req.body;

  // 1. Parse Location (Form-data sends JSON strings)
  let location;
  try {
    location = typeof locationString === 'string' ? JSON.parse(locationString) : locationString;
  } catch (e) {
    res.status(400);
    throw new Error('Invalid location format. Expected JSON string.');
  }

  // 2. Parse Requirements (If sent as a stringified array)
  let parsedRequirements = requirements;
  if (typeof requirements === 'string') {
    try {
      parsedRequirements = JSON.parse(requirements);
    } catch (e) {
      // If parsing fails, assume it's a single string item or CSV
      parsedRequirements = [requirements]; 
    }
  }

  // 3. Handle Banner Image (Multer)
  const banner = req.file ? req.file.path : null;

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
    contactInfo
  });

  res.status(201).json(activity);
});

// @desc    Get all activities
// @route   GET /api/activities
const getAllActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({})
    .populate('ngo', 'name organizationName')
    .sort({ date: 1 }); // Show upcoming first
  res.json(activities);
});

// @desc    User joins an activity
// @route   POST /api/activities/:id/claim
const requestCompletion = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  // 1. Check Deadline
  if (new Date() > new Date(activity.deadline)) {
    res.status(400);
    throw new Error('Registration for this event has closed.');
  }

  // 2. Check Capacity
  if (activity.participants.length >= activity.maxParticipants) {
    res.status(400);
    throw new Error('This event is full.');
  }

  // Check if user already joined
  const existingParticipant = activity.participants.find(
    (p) => p.user.toString() === req.user._id.toString()
  );

  if (existingParticipant) {
    res.status(400);
    throw new Error('You have already joined this activity');
  }

  activity.participants.push({ user: req.user._id, status: 'pending' });
  await activity.save();

  res.json({ message: 'You have successfully joined the mission!' });
});

// @desc    NGO verifies completion
// @route   PUT /api/activities/:id/verify
const verifyCompletion = asyncHandler(async (req, res) => {
  const { userId, status } = req.body; 
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  // Authorization Check
  if (activity.ngo.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
     res.status(403);
     throw new Error('Not authorized to verify this activity');
  }

  const participant = activity.participants.find(
    (p) => p.user.toString() === userId
  );

  if (!participant) {
    res.status(404);
    throw new Error('User has not claimed this activity');
  }

  if (participant.status === 'approved') {
    res.status(400);
    throw new Error('User is already verified');
  }

  // Update Status
  participant.status = status;
  await activity.save();

  // If Approved -> Award Points & Notify
  if (status === 'approved') {
    const result = await awardPoints(
      userId, 
      activity.pointsReward, 
      `Completed Activity: ${activity.title}`
    );

    await sendNotification(
      userId,
      `Mission Approved! You earned ${activity.pointsReward} points for ${activity.title}.`,
      'success',
      activity._id
    );

    res.json({ 
      message: 'User approved and points awarded!',
      gamification: result 
    });
  } else {
    // Notify on rejection
    await sendNotification(
      userId,
      `Update: Your request for ${activity.title} was not approved. Contact the NGO for details.`,
      'warning',
      activity._id
    );
    res.json({ message: 'User request rejected.' });
  }
});

export { createActivity, getAllActivities, requestCompletion, verifyCompletion };