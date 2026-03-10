import asyncHandler   from '../utils/asyncHandler.js';
import Notification   from '../models/Notification.js';

// @desc    Get all notifications for logged-in user (with unread count)
// @route   GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({ notifications, unreadCount });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

export { getMyNotifications, markAsRead, markAllAsRead };
