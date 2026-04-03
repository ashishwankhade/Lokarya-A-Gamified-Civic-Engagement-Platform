// services/twilioWhatsAppService.js
// Handles WhatsApp notifications via Twilio for 3 citizen/worker events.
// Requires in .env:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM   → e.g. whatsapp:+14155238886  (Twilio sandbox or approved number)

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_WHATSAPP_FROM; // whatsapp:+14155238886

/**
 * Low-level sender — all other helpers call this.
 * @param {string} to   — raw phone number, e.g. "+919876543210"
 * @param {string} body — message text
 */
const sendWhatsAppMessage = async (to, body) => {
  if (!to) {
    console.warn('[Twilio WA] Skipped — no phone number provided.');
    return null;
  }

  // Normalise: strip leading zeros / add whatsapp: prefix
  const toFormatted = `whatsapp:${to.startsWith('+') ? to : `+${to}`}`;

  try {
    const message = await client.messages.create({
      from: FROM,
      to:   toFormatted,
      body,
    });
    console.log(`[Twilio WA] Sent to ${toFormatted} | SID: ${message.sid}`);
    return message;
  } catch (err) {
    // Log but never crash the main request flow
    console.error(`[Twilio WA] Failed to send to ${toFormatted}:`, err.message);
    return null;
  }
};

// ─── Template 1: Citizen — Complaint Filed ────────────────────────────────────
/**
 * @param {string} phone      citizen phone
 * @param {string} ticketId   complaint ticket ID
 * @param {string} title      complaint title
 */
const notifyCitizenComplaintFiled = (phone, ticketId, title) =>
  sendWhatsAppMessage(
    phone,
    `✅ *Complaint Filed Successfully!*\n\n` +
    `Your complaint has been registered.\n` +
    `🎫 Ticket ID: *${ticketId}*\n` +
    `📋 Issue: ${title}\n\n` +
    `We will keep you updated on the progress. Thank you for helping us improve our city! 🏙️`
  );

// ─── Template 2: Field Worker — Assigned with Magic Link ─────────────────────
/**
 * @param {string} workerPhone  field worker phone
 * @param {object} complaint    Mongoose complaint doc
 * @param {string} magicLink    one-time upload URL
 */
const notifyWorkerAssigned = (workerPhone, complaint, magicLink) =>
  sendWhatsAppMessage(
    workerPhone,
    `🔧 *New Task Assigned!*\n\n` +
    `Hello! You have been assigned a new complaint.\n\n` +
    `🎫 Ticket ID: *${complaint.ticketId}*\n` +
    `📋 Issue: ${complaint.title}\n` +
    `📍 Location: ${complaint.location?.address || 'See portal'}\n` +
    `🏷️ Category: ${complaint.category}\n\n` +
    `After completing the work, please upload your proof photo using the link below:\n` +
    `📸 *Upload Proof:* ${magicLink}\n\n` +
    `⚠️ This link is valid for 24 hours only. Reply *1* to confirm you have accepted this task.`
  );

// ─── Template 3: Citizen — Complaint Resolved ─────────────────────────────────
/**
 * @param {string} phone     citizen phone
 * @param {string} ticketId  complaint ticket ID
 * @param {string} note      resolution note from officer
 */
const notifyCitizenComplaintResolved = (phone, ticketId, note) =>
  sendWhatsAppMessage(
    phone,
    `🎉 *Your Complaint Has Been Resolved!*\n\n` +
    `🎫 Ticket ID: *${ticketId}*\n` +
    `📝 Resolution Note: ${note || 'Issue has been fixed by our team.'}\n\n` +
    `Please rate our service (1–5 ⭐) on the app so we can keep improving.\n` +
    `Thank you for your patience! 🙏`
  );

export {
  sendWhatsAppMessage,
  notifyCitizenComplaintFiled,
  notifyWorkerAssigned,
  notifyCitizenComplaintResolved,
};
