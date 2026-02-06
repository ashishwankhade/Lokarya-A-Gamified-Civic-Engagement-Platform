import express from 'express';
import { getMapData } from '../controllers/mapController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// This can be public if you want citizens to see the map too.
// Or protect it if only authorities should see it.
router.get('/complaints', protect, getMapData);

export default router;