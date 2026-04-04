// backend-lokarya/src/routes/complaintRoutes.js
import express from 'express';
import {
  createComplaint,
  assignOfficer,
  assignWorker,
  workerWebhook,
  magicUpload,
  resolveComplaint,
  rateComplaint,
  updateComplaintStatus,
  getMyComplaints,
  getComplaints,        // ← was getAllComplaints, now getComplaints
  getComplaintById,     // ← new
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import upload  from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/worker-webhook',              workerWebhook);
router.post('/magic-upload', upload.single('photo'), magicUpload);

// ── Citizen ───────────────────────────────────────────────────────────────────
router.post('/', protect, upload.single('image'), createComplaint);
router.get('/my',         protect, getMyComplaints);          // ← must be before /:id
router.patch('/:id/rate', protect, rateComplaint);

// ── Authority / Admin ─────────────────────────────────────────────────────────
router.get('/',    protect, authorize('local_authority', 'super_admin'), getComplaints);
router.get('/:id', protect, authorize('local_authority', 'super_admin'), getComplaintById);

router.patch('/:id/assign-officer', protect, authorize('local_authority', 'super_admin'), assignOfficer);
router.patch('/:id/assign-worker',  protect, authorize('local_authority', 'super_admin'), assignWorker);
router.patch('/:id/resolve',        protect, authorize('local_authority', 'super_admin'), resolveComplaint);
router.patch('/:id/status',         protect, authorize('local_authority', 'super_admin'), updateComplaintStatus);

export default router;
