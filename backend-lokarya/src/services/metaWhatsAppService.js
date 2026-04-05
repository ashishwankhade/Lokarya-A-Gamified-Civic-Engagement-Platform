// services/metaWhatsAppService.js
// Meta WhatsApp Cloud API — drop-in replacement for twilioWhatsAppService.js
//
// Required .env variables:
//   WHATSAPP_ACCESS_TOKEN          — Permanent System User token
//   WHATSAPP_PHONE_NUMBER_ID       — Your registered sender phone number ID
//   WHATSAPP_WORKER_TEMPLATE_NAME  — Approved template name for worker assignment
//   WHATSAPP_TEMPLATE_LANGUAGE     — e.g. "en_US"
//
// API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages

const BASE_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
};

/**
 * Normalize phone: strip spaces/dashes, ensure leading +
 * Meta requires E.164 format e.g. +919876543210
 */
const normalizePhone = (phone) => {
  const digits = phone.replace(/[\s\-().]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
};

/**
 * Core sender — sends a raw payload to the Meta Cloud API
 * @param {object} payload
 * @returns {object|null}
 */
const sendPayload = async (payload) => {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Meta WA] API error:', JSON.stringify(data, null, 2));
      return null;
    }

    const msgId = data.messages?.[0]?.id;
    console.log(`[Meta WA] Sent | Message ID: ${msgId}`);
    return data;
  } catch (err) {
    console.error('[Meta WA] Network/fetch error:', err.message);
    return null;
  }
};

// ─── Generic text message sender ─────────────────────────────────────────────

/**
 * Send a plain-text WhatsApp message.
 * NOTE: Only works within a 24-hour customer service window (user messaged first),
 * or use approved templates for outbound-initiated messages.
 *
 * @param {string} to   — phone number (E.164 or with country code, no +)
 * @param {string} body — message text
 */
const sendWhatsAppMessage = async (to, body) => {
  if (!to) {
    console.warn('[Meta WA] Skipped — no phone number provided.');
    return null;
  }

  return sendPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'text',
    text: {
      preview_url: false,
      body,
    },
  });
};

// ─── Template 1: Citizen — Complaint Filed ────────────────────────────────────
/**
 * Notify citizen that their complaint was registered.
 *
 * Uses a plain text message (valid within 24-hr session) OR
 * set up an approved template named "complaint_filed" with params:
 *   {{1}} = ticketId  {{2}} = title
 *
 * @param {string} phone
 * @param {string} ticketId
 * @param {string} title
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

// ─── Template 2: Field Worker — Assigned (with approved template) ─────────────
/**
 * Notify field worker about a new task using an approved Meta template.
 * Falls back to plain text if template env vars are missing.
 *
 * Template body (example — match your approved template exactly):
 *   New task assigned! 🔧
 *   Ticket: {{1}}
 *   Issue: {{2}}
 *   Location: {{3}}
 *   Category: {{4}}
 *   View on Maps: {{5}}
 *   Upload Proof: {{6}}
 *
 * @param {string} workerPhone
 * @param {object} complaint
 * @param {string} magicLink   — full upload URL
 * @param {string} _token      — unused (kept for API compatibility with Twilio version)
 */
const notifyWorkerAssigned = async (workerPhone, complaint, magicLink, _token) => {
  if (!workerPhone) {
    console.warn('[Meta WA] Skipped — no phone number provided.');
    return null;
  }

  const lat = complaint.location?.coordinates?.[1];
  const lng = complaint.location?.coordinates?.[0];
  const coords = lat && lng
    ? `${lat},${lng}`
    : encodeURIComponent(complaint.location?.address || 'Unknown');

  const mapsLink = `https://maps.google.com/?q=${coords}`;

  // ── Option A: Approved template ───────────────────────────────────────────
  if (
    process.env.WHATSAPP_WORKER_TEMPLATE_NAME &&
    process.env.WHATSAPP_TEMPLATE_LANGUAGE
  ) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizePhone(workerPhone),
      type: 'template',
      template: {
        name: process.env.WHATSAPP_WORKER_TEMPLATE_NAME,
        language: {
          code: process.env.WHATSAPP_TEMPLATE_LANGUAGE, // e.g. "en_US"
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: complaint.ticketId },                       // {{1}}
              { type: 'text', text: complaint.title },                          // {{2}}
              { type: 'text', text: complaint.location?.address || 'N/A' },     // {{3}}
              { type: 'text', text: complaint.category },                       // {{4}}
              { type: 'text', text: mapsLink },                                 // {{5}}
              { type: 'text', text: magicLink },                                // {{6}}
            ],
          },
        ],
      },
    };

    try {
      const result = await sendPayload(payload);
      if (result) return result;
      console.warn('[Meta WA] Template send failed, falling back to plain text.');
    } catch (err) {
      console.error('[Meta WA] Template error, falling back to plain text:', err.message);
    }
  }

  // ── Option B: Plain text fallback (sandbox / template pending approval) ───
  return sendWhatsAppMessage(
    workerPhone,
    `🔧 *New Task Assigned!*\n\n` +
    `🎫 Ticket ID: *${complaint.ticketId}*\n` +
    `📋 Issue: ${complaint.title}\n` +
    `📍 Location: ${complaint.location?.address || 'See portal'}\n` +
    `🏷️ Category: ${complaint.category}\n\n` +
    `📍 *View on Maps:* ${mapsLink}\n\n` +
    `📸 *Upload Proof:* ${magicLink}\n\n` +
    `⚠️ Upload link is valid for 24 hours only.`
  );
};

// ─── Template 3: Citizen — Complaint Resolved ────────────────────────────────
/**
 * Notify citizen that their complaint has been resolved.
 *
 * @param {string} phone
 * @param {string} ticketId
 * @param {string} note     — resolution note from corporator/admin
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

// ─── Webhook Verification Helper ─────────────────────────────────────────────
/**
 * Use this in your Express webhook route to verify Meta's GET request.
 *
 * app.get('/api/webhooks/whatsapp', verifyWebhook);
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const verifyWebhook = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Meta WA] Webhook verified.');
    return res.status(200).send(challenge);
  }

  console.warn('[Meta WA] Webhook verification failed.');
  return res.sendStatus(403);
};

/**
 * Parse incoming webhook events from Meta.
 * Returns an array of message objects (or empty array).
 *
 * app.post('/api/webhooks/whatsapp', (req, res) => {
 *   const messages = parseIncomingMessages(req.body);
 *   // handle messages...
 *   res.sendStatus(200); // Always respond 200 quickly
 * });
 */
const parseIncomingMessages = (body) => {
  try {
    const entry   = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    return value?.messages || [];
  } catch {
    return [];
  }
};

export {
  sendWhatsAppMessage,
  notifyCitizenComplaintFiled,
  notifyWorkerAssigned,
  notifyCitizenComplaintResolved,
  verifyWebhook,
  parseIncomingMessages,
};
