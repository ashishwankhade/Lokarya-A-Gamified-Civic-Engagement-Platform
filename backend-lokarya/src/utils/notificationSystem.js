import Notification from '../models/Notification.js';

/**
 * Sends a notification to a specific user.
 * @param {String} userId - The recipient's ID
 * @param {String} message - The text to display
 * @param {String} type - 'info', 'success', 'warning', 'error'
 * @param {String} relatedId - Optional ID of the complaint/activity
 */
export const sendNotification = async (userId, message, type = 'info', relatedId = null) => {
  try {
    await Notification.create({
      user: userId,
      message,
      type,
      relatedId
    });
  } catch (error) {
    console.error("Notification Error:", error);
    // We don't throw error here because we don't want to crash the main process 
    // just because a notification failed to save.
  }
};