// backend-lokarya/src/controllers/fieldWorkerController.js
import asyncHandler from '../utils/asyncHandler.js';
import FieldWorker  from '../models/FieldWorker.js';

// GET /api/field-workers
// Authority sees only their vibhag's workers; super_admin sees all
const getFieldWorkers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === 'local_authority') {
    query.supervisorId = req.user._id;
  }
  const workers = await FieldWorker.find(query)
    .populate('activeComplaints', '_id')
    .sort({ createdAt: -1 });
  res.json(workers);
});

// POST /api/field-workers
const createFieldWorker = asyncHandler(async (req, res) => {
  const { name, employeeId, phone, vibhag } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error('Name and phone are required.');
  }

  // Auto-generate employeeId if not provided
  const resolvedEmployeeId = employeeId?.trim() ||
    `LKY-W-${Date.now().toString().slice(-5)}`;

  // Use the authority's vibhag if not supplied
  const resolvedVibhag = vibhag?.trim() || req.user.vibhag || 'Other';

  const worker = await FieldWorker.create({
    name,
    employeeId: resolvedEmployeeId,
    phone,
    vibhag:      resolvedVibhag,
    supervisorId: req.user._id,
  });

  res.status(201).json(worker);
});

// DELETE /api/field-workers/:id
const deleteFieldWorker = asyncHandler(async (req, res) => {
  const worker = await FieldWorker.findById(req.params.id);
  if (!worker) { res.status(404); throw new Error('Worker not found.'); }

  // Authority can only delete their own workers
  if (
    req.user.role === 'local_authority' &&
    worker.supervisorId.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this worker.');
  }

  await worker.deleteOne();
  res.json({ message: 'Worker removed.' });
});

export { getFieldWorkers, createFieldWorker, deleteFieldWorker };