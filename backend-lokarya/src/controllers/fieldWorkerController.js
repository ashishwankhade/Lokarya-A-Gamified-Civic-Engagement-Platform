// backend-lokarya/src/controllers/fieldWorkerController.js
import asyncHandler from '../utils/asyncHandler.js';
import FieldWorker  from '../models/FieldWorker.js';

// ─── Helper: generate a guaranteed-unique employeeId ─────────────────────────
// Tries the provided id first, then falls back to timestamp+random.
// Retries up to 5 times if there's a collision in DB.
const generateUniqueEmployeeId = async (preferred) => {
  if (preferred?.trim()) {
    const exists = await FieldWorker.findOne({ employeeId: preferred.trim() });
    if (!exists) return preferred.trim();
    // If the preferred one is taken, fall through to auto-generate
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `LKY-W-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const exists = await FieldWorker.findOne({ employeeId: candidate });
    if (!exists) return candidate;
  }

  // Absolute fallback — UUID-like string, collision practically impossible
  return `LKY-W-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
};

// ─── Helper: normalize phone to +91XXXXXXXXXX ────────────────────────────────
const normalizePhone = (raw) => {
  // Strip all non-digit characters except leading +
  const stripped = raw.replace(/[^\d+]/g, '');
  const digits   = stripped.replace(/^\+/, '');      // remove leading +

  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;                             // 919876543210  → +919876543210
  }
  if (digits.length === 10) {
    return `+91${digits}`;                           // 9876543210    → +919876543210
  }
  // Already has +91 prefix passed as string
  if (stripped.startsWith('+91') && digits.length === 12) {
    return stripped;
  }
  // Return as-is with +91 prepended — backend validation can catch bad numbers
  return `+91${digits}`;
};

// ─── GET /api/field-workers ───────────────────────────────────────────────────
// Authority → only their workers | super_admin → all workers
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

// ─── POST /api/field-workers ──────────────────────────────────────────────────
const createFieldWorker = asyncHandler(async (req, res) => {
  const { name, employeeId, phone, vibhag } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Name is required.');
  }
  if (!phone?.trim()) {
    res.status(400);
    throw new Error('Phone number is required.');
  }

  // ── Resolve fields ──────────────────────────────────────────────────────────
  const resolvedEmployeeId = await generateUniqueEmployeeId(employeeId);
  const resolvedPhone      = normalizePhone(phone);
  const resolvedVibhag     = vibhag?.trim() || req.user.vibhag || 'Other';

  // ── Check duplicate phone ───────────────────────────────────────────────────
  const phoneExists = await FieldWorker.findOne({ phone: resolvedPhone });
  if (phoneExists) {
    res.status(409);
    throw new Error(`A worker with phone ${resolvedPhone} already exists.`);
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  const worker = await FieldWorker.create({
    name:         name.trim(),
    employeeId:   resolvedEmployeeId,
    phone:        resolvedPhone,
    vibhag:       resolvedVibhag,
    supervisorId: req.user._id,
  });

  res.status(201).json(worker);
});

// ─── DELETE /api/field-workers/:id ───────────────────────────────────────────
const deleteFieldWorker = asyncHandler(async (req, res) => {
  const worker = await FieldWorker.findById(req.params.id);

  if (!worker) {
    res.status(404);
    throw new Error('Worker not found.');
  }

  // Authority can only delete workers they supervise
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
