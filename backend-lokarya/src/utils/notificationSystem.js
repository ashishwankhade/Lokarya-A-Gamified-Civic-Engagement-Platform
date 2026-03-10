/**
 * notificationSystem.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utility called by all controllers to push in-app notifications to users.
 * Path: backend-lokarya/src/utils/notificationSystem.js
 */

import Notification from '../models/Notification.js';

/**
 * sendNotification
 * @param {string|ObjectId} userId    — recipient
 * @param {string}          message   — notification text
 * @param {string}          type      — 'info' | 'success' | 'error' | 'warning'
 * @param {string|ObjectId} [refId]   — optional: activityId or complaintId for deep-link
 */
export const sendNotification = async (userId, message, type = 'info', refId = null) => {
  try {
    await Notification.create({
      user:      userId,
      message,
      type,
      relatedId: refId || null, // FIX: was 'refId' — must match model field 'relatedId'
      isRead:    false,          // FIX: was 'read' — must match model field 'isRead'
    });
  } catch (err) {
    // Non-fatal — notifications failing should never crash the main flow
    console.warn('[Notification] Failed to create notification:', err.message);
  }
};
