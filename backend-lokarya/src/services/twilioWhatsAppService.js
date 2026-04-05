// services/twilioWhatsAppService.js
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_WHATSAPP_FROM;

const sendWhatsAppMessage = async (to, body) => {
  if (!to) {
    console.warn('[Twilio WA] Skipped — no phone number provided.');
    return null;
  }

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
    console.error(`[Twilio WA] Failed to send to ${toFormatted}:`, err.message);
    return null;
  }
};

// ─── Template 1: Citizen — Complaint Filed ────────────────────────────────────
const notifyCitizenComplaintFiled = (phone, ticketId, title) =>
  sendWhatsAppMessage(
    phone,
    `✅ *Complaint Filed Successfully!*\n\n` +
    `Your complaint has been registered.\n` +
    `🎫 Ticket ID: *${ticketId}*\n` +
    `📋 Issue: ${title}\n\n` +
    `We will keep you updated on the progress. Thank you for helping us improve our city! 🏙️`
  );

// ─── Template 2: Field Worker — Assigned with Buttons ────────────────────────
/**
 * @param {string} workerPhone
 * @param {object} complaint
 * @param {string} magicLink    full URL — used in plain text fallback
 * @param {string} token        raw token only — used in Content Template button
 */
const notifyWorkerAssigned = async (workerPhone, complaint, magicLink, token) => {
  if (!workerPhone) {
    console.warn('[Twilio WA] Skipped — no phone number provided.');
    return null;
  }

  const toFormatted = `whatsapp:${workerPhone.startsWith('+') ? workerPhone : `+${workerPhone}`}`;

  const lat = complaint.location?.coordinates?.[1];
  const lng = complaint.location?.coordinates?.[0];
  const coords = lat && lng
    ? `${lat},${lng}`
    : encodeURIComponent(complaint.location?.address || 'Unknown');

  // ── Option A: Approved Content Template with buttons ──────────────────────
  if (process.env.TWILIO_WORKER_TEMPLATE_SID) {
    try {
      const message = await client.messages.create({
        from:       FROM,
        to:         toFormatted,
        contentSid: process.env.TWILIO_WORKER_TEMPLATE_SID,
        contentVariables: JSON.stringify({
          "1": complaint.ticketId,                      // body {{1}}
          "2": complaint.title,                         // body {{2}}
          "3": complaint.location?.address || 'N/A',   // body {{3}}
          "4": complaint.category,                      // body {{4}}
          "5": coords,   // Button 1 → https://maps.google.com/?q={{1}}
          "6": token,    // Button 2 → https://lokarya.vercel.app/worker/upload?token={{1}}
        }),
      });
      console.log(`[Twilio WA] Worker notified (template) | SID: ${message.sid}`);
      return message;
    } catch (err) {
      console.error(`[Twilio WA] Template send failed, falling back to plain text:`, err.message);
    }
  }

  // ── Option B: Plain text fallback (sandbox / template not approved yet) ───
  return sendWhatsAppMessage(
    workerPhone,
    `🔧 *New Task Assigned!*\n\n` +
    `🎫 Ticket ID: *${complaint.ticketId}*\n` +
    `📋 Issue: ${complaint.title}\n` +
    `📍 Location: ${complaint.location?.address || 'See portal'}\n` +
    `🏷️ Category: ${complaint.category}\n\n` +
    `📍 *View on Maps:* https://maps.google.com/?q=${coords}\n\n` +
    `📸 *Upload Proof:* ${magicLink}\n\n` +
    `⚠️ Upload link is valid for 24 hours only.`
  );
};

// ─── Template 3: Citizen — Complaint Resolved ────────────────────────────────
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