import express from 'express';
import upload from '../middlewares/uploadMiddleware.js'; // Multer config
import {
  createActivity,
  updateActivity, 
  getActivityById, 
  getAllActivities,
  getPendingApprovals,
  requestCompletion,
  verifyCompletion
} from '../controllers/activityController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==========================================
// 1. STATIC ROUTES (MUST BE AT THE TOP)
// ==========================================

/**
 * @route   GET /api/activities
 */
router.get('/', getAllActivities);

/**
 * @route   GET /api/activities/pending-approvals
 * @note    MUST be before /:id so Express doesn't think "pending-approvals" is an ID
 */
router.get(
  '/pending-approvals', 
  protect, 
  authorize('ngo_admin', 'super_admin'), 
  getPendingApprovals
);

/**
 * @route   POST /api/activities
 * Create a new mission
 */
router.post(
  '/', 
  protect, 
  authorize('ngo_admin', 'super_admin'), 
  upload.single('image'), 
  createActivity
);


// ==========================================
// 2. DYNAMIC ROUTES (ID ROUTES MUST BE AT BOTTOM)
// ==========================================

/**
 * @route   GET /api/activities/:id
 * Used by both public view and NGO Edit form
 */
router.get('/:id', getActivityById);

/**
 * @route   POST /api/activities/:id/claim
 * General User applies for mission
 */
router.post('/:id/claim', protect, requestCompletion);

/**
 * @route   PUT /api/activities/:id/verify
 * NGO verifies the volunteer
 */
router.put(
  '/:id/verify', 
  protect, 
  authorize('ngo_admin', 'super_admin'), 
  verifyCompletion
);

/**
 * @route   PUT /api/activities/:id
 * Update an existing mission
 */
router.put(
  '/:id', 
  protect, 
  authorize('ngo_admin', 'super_admin'), 
  upload.single('image'), // Allows updating the banner image
  updateActivity
);

export default router;