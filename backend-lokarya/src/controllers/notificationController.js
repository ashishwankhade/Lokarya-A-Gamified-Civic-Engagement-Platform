import  asyncHandler from '../utils/asyncHandler.js';
import Notification from '../models/Notification.js';

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 }); // Newest first
  res.json(notifications);
});

// @desc    Mark a notification as read
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
    throw new Error('Not authorized');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true });
});

// @desc    Mark ALL as read (Optional UX improvement)
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  res.json({ message: 'All marked as read' });
});

export { getMyNotifications, markAsRead, markAllAsRead };