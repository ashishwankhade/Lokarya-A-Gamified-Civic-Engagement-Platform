import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      ref:      'User',
      index:    true, // FIX: index for fast per-user queries
    },
    message: {
      type:     String,
      required: true,
      trim:     true,
    },
    type: {
      type:    String,
      enum:    ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    isRead: {
      type:    Boolean,
      default: false,
      index:   true, // FIX: index for fast unread-count queries
    },
    relatedId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

// FIX: auto-delete notifications older than 30 days — keeps collection lean
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
