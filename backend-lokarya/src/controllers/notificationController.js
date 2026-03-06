import asyncHandler from '../utils/asyncHandler.js';
import Notification from '../models/Notification.js';

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  // Check if user exists first (Safety check)
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 }); // Newest first
  
  // Always return an array, even if empty
  res.json(notifications || []);
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Ensure user owns this notification
  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to manage this notification');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark ALL as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  
  res.json({ success: true, message: 'All notifications marked as read' });
});

export { getMyNotifications, markAsRead, markAllAsRead };