import express from 'express';
import rateLimit from 'express-rate-limit';
import upload from '../middlewares/uploadMiddleware.js'; 
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rate Limiter
const createComplaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: { status: 429, message: "Too many complaints. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// @desc    Create Complaint (Citizen)
router.route('/')
  .post(protect, createComplaintLimiter, upload.single('image'), createComplaint); 

// @desc    Get My Complaints (Citizen)
router.route('/my').get(protect, getMyComplaints);

// @desc    Get All Complaints (Authority/Admin)
router.route('/')
  .get(protect, getAllComplaints);

// @desc    Update Status / Resolve (Authority)
// @route   PUT /api/complaints/:id/status
router.route('/:id/status').put(
  // 1. Log Request Arrival
  (req, res, next) => {
    console.log("------------------------------------------");
    console.log(`[ROUTE DEBUG] PUT Request received for ID: ${req.params.id}`);
    next();
  },

  // 2. Auth Check
  protect,
  (req, res, next) => {
    console.log(`[ROUTE DEBUG] Auth Passed. User: ${req.user?._id}, Role: ${req.user?.role}`);
    next();
  },

  // 3. Role Check
  authorize('local_authority', 'super_admin'), 
  (req, res, next) => {
    console.log("[ROUTE DEBUG] Authorization Passed. Starting File Upload...");
    next();
  },

  // 4. File Upload (Wrapped to catch errors)
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        // Log the specific Multer error
        console.error("❌ [ROUTE DEBUG] Multer/Upload Error:", err.message);
        return res.status(400).json({ message: "Upload Failed", error: err });
        // return res.status(400).json({ message: `Upload Failed: ${err.message}` });
      }
      
      console.log(`[ROUTE DEBUG] Upload Middleware Passed.`);
      console.log(`   - File Present: ${!!req.file}`);
      console.log(`   - Body Keys: ${Object.keys(req.body)}`);
      
      next(); // Proceed to controller
    });
  },

  // 5. Final Controller Call
  updateComplaintStatus
);

export default router;