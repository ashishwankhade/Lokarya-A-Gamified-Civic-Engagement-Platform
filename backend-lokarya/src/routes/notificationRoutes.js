import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);

// FIX: /read-all MUST be before /:id/read
// Otherwise Express matches "read-all" as the :id param and calls markAsRead
// with id="read-all", which fails with a CastError instead of marking all read
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
