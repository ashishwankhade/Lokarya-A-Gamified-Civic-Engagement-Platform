import express from 'express';
import {
  getSuperAdminStats,
  getNGOStats,
  getAuthorityStats,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 1. Super Admin Route
router.get(
  '/super-admin',
  protect,
  authorize('super_admin'),
  getSuperAdminStats
);

// 2. NGO Admin Route
router.get(
  '/ngo',
  protect,
  authorize('ngo_admin', 'super_admin'), // Super admin can peek
  getNGOStats
);

// 3. Local Authority Route
router.get(
  '/authority',
  protect,
  authorize('local_authority', 'super_admin'), // Super admin can peek
  getAuthorityStats
);

export default router;