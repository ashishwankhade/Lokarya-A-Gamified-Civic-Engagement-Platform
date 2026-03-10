/**
 * adminRoutes.js
 * All routes under /api/admin — super_admin only.
 * Path: backend-lokarya/src/routes/adminRoutes.js
 *
 * Register in server.js:
 *   import adminRoutes from './routes/adminRoutes.js';
 *   app.use('/api/admin', adminRoutes);
 */

import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
  getPlatformStats,
  getAnalytics,
  getAllUsers, getUserDetail, updateUserRole, toggleUserBan,
  manualAwardXp, revokeXp,                                      // ← revokeXp added
  deleteUser,
  getAllNgos, updateNgoStatus,
  getPendingActivities, reviewActivity,
  getAllComplaintsAdmin, forceComplaintStatus,
  getXpRules, updateXpRule, toggleXpRule, resetXpRules,
  getXpLedger,                                                   // ← getXpLedger added
} from '../controllers/adminController.js';
import {
  createPrivilegedUser,
  getVibhags,
} from '../controllers/privilegedAuthController.js';

const router = express.Router();

// All admin routes require super_admin
router.use(protect, authorize('super_admin'));

// ── STATS & ANALYTICS ──────────────────────────────────────────────────────
router.get('/stats',     getPlatformStats);
router.get('/analytics', getAnalytics);

// ── USER MANAGEMENT ────────────────────────────────────────────────────────
// ⚠ ORDERING MATTERS:
//   Static paths (/users/create, /users/create/vibhags) MUST come before
//   /users/:id — otherwise Express treats the word "create" as an id value.
router.get   ('/users',                getAllUsers);
router.get   ('/users/create/vibhags', getVibhags);
router.post  ('/users/create',         createPrivilegedUser);
router.get   ('/users/:id',            getUserDetail);
router.patch ('/users/:id/role',       updateUserRole);
router.patch ('/users/:id/ban',        toggleUserBan);
router.post  ('/users/:id/award-xp',   manualAwardXp);
router.post  ('/users/:id/revoke-xp',  revokeXp);               // ← NEW
router.delete('/users/:id',            deleteUser);

// ── NGO MANAGEMENT ─────────────────────────────────────────────────────────
router.get   ('/ngos',            getAllNgos);
router.patch ('/ngos/:id/status', updateNgoStatus);

// ── ACTIVITY APPROVAL ──────────────────────────────────────────────────────
// ⚠ /activities/pending must be BEFORE /activities/:id
router.get   ('/activities/pending',    getPendingActivities);
router.patch ('/activities/:id/review', reviewActivity);

// ── COMPLAINT OVERSIGHT ────────────────────────────────────────────────────
router.get   ('/complaints',                  getAllComplaintsAdmin);
router.patch ('/complaints/:id/force-status', forceComplaintStatus);

// ── XP RULE ENGINE ─────────────────────────────────────────────────────────
// ⚠ /xp-rules/reset must be BEFORE /xp-rules/:id
router.get   ('/xp-rules',            getXpRules);
router.post  ('/xp-rules/reset',      resetXpRules);
router.patch ('/xp-rules/:id',        updateXpRule);
router.patch ('/xp-rules/:id/toggle', toggleXpRule);

// ── XP LEDGER AUDIT ────────────────────────────────────────────────────────
router.get('/xp-ledger', getXpLedger);                           // ← NEW

export default router;
