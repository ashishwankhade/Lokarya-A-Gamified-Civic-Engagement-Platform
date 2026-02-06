import express from 'express';
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  createUserByAdmin,
  getOfficers // Import the new function
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply security to all admin routes
router.use(protect);
router.use(authorize('super_admin'));

router.get('/pending', getPendingUsers);
router.put('/approve/:id', approveUser);
router.delete('/reject/:id', rejectUser);
router.get('/officers', getOfficers);

// New Route for creating users manually
router.post('/create-user', createUserByAdmin);

export default router;