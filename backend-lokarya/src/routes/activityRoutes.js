import express from 'express';
import upload from '../middlewares/uploadMiddleware.js'; // Import Multer config
import {
  createActivity,
  getAllActivities,
  requestCompletion,
  verifyCompletion
} from '../controllers/activityController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllActivities);

// Updated Route: Accepts 'banner' file upload
// 'banner' is the key name for form-data
router.post(
  '/', 
  protect, 
  authorize('ngo_admin', 'super_admin'), 
  upload.single('banner'), 
  createActivity
);

router.post('/:id/claim', protect, requestCompletion);

router.put('/:id/verify', protect, authorize('ngo_admin', 'super_admin'), verifyCompletion);

export default router;