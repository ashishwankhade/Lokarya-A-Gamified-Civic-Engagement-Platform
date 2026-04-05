/**
 * activityRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes for the 7-Step QR Attendance Flow + Legacy fallbacks.
 *
 * Route map:
 *
 *  STATIC / ADMIN
 *  GET    /api/activities                          → feed (all open, approved)
 *  GET    /api/activities/pending-approvals        → NGO legacy pending list
 *  GET    /api/activities/admin/pending            → super_admin approval queue
 *  POST   /api/activities                          → Step 1: NGO creates
 *
 *  DYNAMIC — always below static routes
 *  GET    /api/activities/:id                      → single activity
 *  PUT    /api/activities/:id                      → NGO updates activity
 *  PATCH  /api/activities/:id/approve              → Step 2: admin approves + QR generated
 *  GET    /api/activities/:id/qr                   → NGO fetches QR PNG
 *  POST   /api/activities/:id/regenerate-qr        → NGO regenerates QR
 *  POST   /api/activities/:id/register             → Step 3: citizen registers
 *  POST   /api/activities/scan-qr                  → Step 4+5: citizen scans QR
 *  PATCH  /api/activities/:id/gps-override         → Step 5b: NGO manual GPS confirm
 *  GET    /api/activities/:id/attendance           → Step 6: NGO attendance list
 *  POST   /api/activities/:id/end-event            → Step 6: NGO ends event + Step 7 auto-runs
 *
 *  LEGACY (backward compat with old ActivityPage)
 *  POST   /api/activities/:id/claim                → alias → register
 *  PUT    /api/activities/:id/verify               → old NGO verify
 */

import express from 'express';
import upload  from '../middlewares/uploadMiddleware.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

import {
  // New QR flow
  createActivity,
  approveActivity,
  regenerateQr,
  registerForActivity,
  scanQr,
  gpsOverride,
  endEvent,
  getAttendanceList,
  getQrCode,
  getAdminPendingActivities,

  // Legacy / shared
  getAllActivities,
  getActivityById,
  updateActivity,
  getPendingApprovals,
  requestCompletion,     // alias → register
  verifyCompletion,      // old NGO verify
   getMyActivities
} from '../controllers/activityController.js';

const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// STATIC ROUTES — must be above /:id
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/activities
 * Public feed of all open, admin-approved activities.
 * Used by ActivityPage and MissionCarousel.
 */
router.get('/', getAllActivities);

/**
 * GET /api/activities/pending-approvals
 * Legacy — NGO sees its own pending volunteer approvals.
 * MUST be before /:id so Express doesn't treat "pending-approvals" as an ID.
 */
router.get(
  '/pending-approvals',
  protect,
  authorize('ngo_admin', 'super_admin'),
  getPendingApprovals
);

/**
 * GET /api/activities/admin/pending
 * Super-admin queue: all activities awaiting approval (Step 2 trigger).
 */
router.get(
  '/admin/pending',
  protect,
  authorize('super_admin'),
  getAdminPendingActivities
);

router.get(
  '/my',
  protect,
  authorize('ngo_admin', 'super_admin'),
  getMyActivities
);

/**
 * POST /api/activities/scan-qr
 * Step 4+5: Citizen scans QR at venue. 3-layer verification gate.
 * Body: { payload: string, userLat: number, userLng: number }
 * MUST be static (before /:id) — no ID segment.
 */
router.post(
  '/scan-qr',
  protect,
  scanQr
);

/**
 * POST /api/activities
 * Step 1: NGO creates a new activity (goes to pending_approval).
 */
router.post(
  '/',
  protect,
  authorize('ngo_admin', 'super_admin'),
  upload.single('banner'),
  createActivity
);


// ══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ROUTES — all require :id
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/activities/:id
 * Single activity — public.
 */
router.get('/:id', getActivityById);

/**
 * PUT /api/activities/:id
 * NGO updates activity details (before approval or after — NGO only).
 */
router.put(
  '/:id',
  protect,
  authorize('ngo_admin', 'super_admin'),
  upload.single('banner'),
  updateActivity
);

/**
 * PATCH /api/activities/:id/approve
 * Step 2: Super-admin reviews → approves or rejects.
 * On approval, QR is auto-generated and stored.
 * Body: { decision: 'approved'|'rejected', adminNote?: string }
 */
router.patch(
  '/:id/approve',
  protect,
  authorize('super_admin'),
  approveActivity
);

/**
 * GET /api/activities/:id/qr
 * NGO fetches the QR PNG data URL for display / printing.
 * Only NGO owner or super_admin.
 */
router.get(
  '/:id/qr',
  protect,
  authorize('ngo_admin', 'super_admin'),
  getQrCode
);

/**
 * POST /api/activities/:id/regenerate-qr
 * NGO requests a fresh QR (e.g. if previous was compromised).
 */
router.post(
  '/:id/regenerate-qr',
  protect,
  authorize('ngo_admin', 'super_admin'),
  regenerateQr
);

/**
 * POST /api/activities/:id/register
 * Step 3: Citizen registers for a mission.
 * Sends confirmation notification (SMS in prod).
 * Points shown as "pending" until QR scan + event end.
 */
router.post(
  '/:id/register',
  protect,
  registerForActivity
);

/**
 * PATCH /api/activities/:id/gps-override
 * Step 5b: NGO manually confirms an attendee whose GPS failed.
 * Body: { userId: string }
 */
router.patch(
  '/:id/gps-override',
  protect,
  authorize('ngo_admin', 'super_admin'),
  gpsOverride
);

/**
 * GET /api/activities/:id/attendance
 * Step 6 (view): NGO sees live attendance list with QR scan status + GPS result.
 */
router.get(
  '/:id/attendance',
  protect,
  authorize('ngo_admin', 'super_admin'),
  getAttendanceList
);

/**
 * POST /api/activities/:id/end-event
 * Step 6: NGO ends event → marks absences → expires QR → triggers Step 7.
 * Step 7 (points distribution) runs automatically inside this handler.
 * Body: { absentUserIds: string[] }
 */
router.post(
  '/:id/end-event',
  protect,
  authorize('ngo_admin', 'super_admin'),
  endEvent
);


// ══════════════════════════════════════════════════════════════════════════════
// LEGACY ROUTES — backward compat with old ActivityPage.jsx /claim & /verify
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/activities/:id/claim
 * Legacy alias → registerForActivity.
 * Old ActivityPage calls this; it now goes through the new registration flow.
 */
router.post(
  '/:id/claim',
  protect,
  requestCompletion
);

/**
 * PUT /api/activities/:id/verify
 * Legacy NGO verify (old manual approval flow).
 * Still works but new flow uses end-event + QR scan.
 */
router.put(
  '/:id/verify',
  protect,
  authorize('ngo_admin', 'super_admin'),
  verifyCompletion
);




export default router;
