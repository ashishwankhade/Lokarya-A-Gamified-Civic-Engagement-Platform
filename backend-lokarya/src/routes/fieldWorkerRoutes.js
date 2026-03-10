// backend-lokarya/src/routes/fieldWorkerRoutes.js
import express from 'express';
import {
  getFieldWorkers,
  createFieldWorker,
  deleteFieldWorker,
} from '../controllers/fieldWorkerController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('local_authority', 'super_admin'));

router.get('/',    getFieldWorkers);
router.post('/',   createFieldWorker);
router.delete('/:id', deleteFieldWorker);

export default router;