// services/smsService.js
// ─────────────────────────────────────────────────────────────────────────────
// Currently mocked — swap console.log calls with MSG91 API calls when ready.
// MSG91 integration: https://docs.msg91.com/reference/send-sms
// ─────────────────────────────────────────────────────────────────────────────

const sendSMS = async (phone, message) => {
  // TODO: replace with MSG91 API call
  console.log(`[SMS → ${phone}]: ${message}`);
};

const sendWhatsApp = async (phone, message) => {
  // TODO: replace with Meta Cloud API / Twilio WhatsApp call
  console.log(`[WhatsApp → ${phone}]: ${message}`);
};

export const smsTemplates = {
  // Step 1 — Citizen files complaint
  complaintFiled: (ticketId) =>
    `Your complaint has been registered on Lokarya. Ticket ID: ${ticketId}. Track status at lokarya.in/track`,

  // Step 6 — Worker accepted
  workerAccepted: (ticketId, workerName) =>
    `Update on ${ticketId}: Field worker ${workerName} has accepted your complaint and is on the way.`,

  // Step 8 — Resolved
  complaintResolved: (ticketId) =>
    `Your complaint ${ticketId} has been resolved! Reply with a rating 1-5 to confirm. No reply = auto-closed in 72hrs.`,

  // Step 9 — Escalated
  complaintEscalated: (ticketId) =>
    `Your complaint ${ticketId} has been escalated for re-review based on your feedback. We apologize for the inconvenience.`,
};

export const whatsAppTemplates = {
  // Step 5 — Worker notification
  workerAssigned: (complaint, magicLink) =>
    `🚨 *New Task Assigned — Lokarya*\n\n` +
    `*Ticket:* ${complaint.ticketId}\n` +
    `*Category:* ${complaint.category}\n` +
    `*Location:* ${complaint.location.address}\n` +
    `*Vibhag:* ${complaint.vibhag}\n` +
    `*Description:* ${complaint.description}\n\n` +
    `Reply *1* to accept this task.\n\n` +
    `📎 Upload proof here after completion:\n${magicLink}`,
};

export { sendSMS, sendWhatsApp };
