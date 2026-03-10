/**
 * qrService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates and verifies signed QR payloads for activity attendance.
 *
 * QR payload structure (base64-encoded JSON):
 * {
 *   activityId : string,
 *   token      : string,   ← HMAC-SHA256 signature
 *   venueLat   : number,
 *   venueLng   : number,
 *   expiresAt  : ISO string,
 *   issuedAt   : ISO string,
 * }
 */

import crypto from 'crypto';
import QRCode  from 'qrcode';

const QR_SECRET = process.env.QR_SECRET || 'lokarya_qr_secret_change_in_prod';

const sign = (data) =>
  crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');

export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R   = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const generateQrData = async (activityId, venueLat, venueLng, eventDate) => {
  const expiresAt = new Date(new Date(eventDate).getTime() + 2 * 60 * 60 * 1000);
  const issuedAt  = new Date();

  const signable = `${activityId}|${venueLat}|${venueLng}|${expiresAt.toISOString()}`;
  const token    = sign(signable);

  const payloadObj = {
    activityId,
    token,
    venueLat,
    venueLng,
    expiresAt: expiresAt.toISOString(),
    issuedAt:  issuedAt.toISOString(),
  };

  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');

  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    width:  400,
    margin: 2,
    color:  { dark: '#0f2c4a', light: '#ffffff' },
  });

  return { token, payload, expiresAt, dataUrl };
};

/**
 * verifyQrPayload
 * FIX: now returns `token` in the success result so activityController
 *      can compare qrResult.token === activity.qr.token
 */
export const verifyQrPayload = (rawPayload) => {
  try {
    const decoded = JSON.parse(Buffer.from(rawPayload, 'base64').toString('utf8'));
    const { activityId, token, venueLat, venueLng, expiresAt } = decoded;

    // Layer 1A — required fields
    if (!activityId || !token || !venueLat || !venueLng || !expiresAt) {
      return { valid: false, error: 'Malformed QR payload.' };
    }

    // Layer 1B — expiry
    if (new Date() > new Date(expiresAt)) {
      return { valid: false, error: 'QR code has expired.' };
    }

    // Layer 1C — HMAC signature
    const signable  = `${activityId}|${venueLat}|${venueLng}|${expiresAt}`;
    const expected  = sign(signable);
    const tokenBuf  = Buffer.from(token,    'hex');
    const expectBuf = Buffer.from(expected, 'hex');

    if (
      tokenBuf.length !== expectBuf.length ||
      !crypto.timingSafeEqual(tokenBuf, expectBuf)
    ) {
      return { valid: false, error: 'Invalid QR signature. Possible tampering.' };
    }

    // FIX: include token in return so controller can do:
    //      activity.qr.token !== qrResult.token
    return { valid: true, activityId, token, venueLat, venueLng, expiresAt };

  } catch (err) {
    return { valid: false, error: 'Could not decode QR payload.' };
  }
};
