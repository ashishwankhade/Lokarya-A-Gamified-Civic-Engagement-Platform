import asyncHandler    from '../utils/asyncHandler.js';
import Complaint       from '../models/Complaint.js';
import FieldWorker     from '../models/FieldWorker.js';
import User            from '../models/User.js';
import { getDistanceFromLatLonInM } from '../utils/locationUtils.js';
import { sendNotification }         from '../utils/notificationSystem.js';
import { awardXp }                  from '../services/xpEngineService.js';
import {
  notifyCitizenComplaintFiled,
  notifyWorkerAssigned,
  notifyCitizenComplaintResolved,
} from '../services/twilioWhatsAppService.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── STEP 1 & 2: Citizen files complaint ──────────────────────────────────────
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, vibhag, location: locationString } = req.body;
    // console.log('📁 req.file:', req.file);


  let location = {};
  try {
    const parsed = typeof locationString === 'string' ? JSON.parse(locationString) : locationString;
    location = { address: parsed.address, lat: Number(parsed.lat), lng: Number(parsed.lng) };
    if (isNaN(location.lat) || isNaN(location.lng)) throw new Error();
  } catch {
    res.status(400); throw new Error('Invalid location format.');
  }

  // ✅ FIX: prefer Cloudinary secure_url, fall back to path
  const image = req.file ? (req.file.secure_url || req.file.path) : null;

  // ── Duplicate detection within 50 m ──────────────────────────────────────
  const DUPLICATE_RADIUS = 50;
  const active = await Complaint.find({ category, status: { $in: ['pending', 'in_progress'] } });
  let duplicate = null;
  for (const c of active) {
    if (c.location?.lat && c.location?.lng) {
      const dist = getDistanceFromLatLonInM(location.lat, location.lng, c.location.lat, c.location.lng);
      if (dist < DUPLICATE_RADIUS) { duplicate = c; break; }
    }
  }

  if (duplicate) {
    if (duplicate.supportedBy.includes(req.user._id)) {
      res.status(400); throw new Error('You have already reported or supported this issue.');
    }
    duplicate.supportedBy.push(req.user._id);
    duplicate.upvotes.push(req.user._id);
    duplicate.supportCount = (duplicate.supportCount || 0) + 1;
    duplicate.timeline.push({
      status:    duplicate.status,
      message:   'Priority increased — verified by another citizen.',
      updatedBy: req.user._id,
    });
    await duplicate.save();

    await awardXp(req.user._id, 'verify_duplicate', { complaintId: duplicate._id });

    return res.status(200).json({
      message:     'Issue verified! Your vote increases its priority.',
      isDuplicate: true,
      complaint:   duplicate,
    });
  }

  // ── Create new complaint ──────────────────────────────────────────────────
  const complaint = await Complaint.create({
    user: req.user._id, title, description, category, vibhag, location, image,
    supportedBy: [req.user._id], upvotes: [req.user._id], status: 'pending',
  });

  if (req.user.phone) {
    await notifyCitizenComplaintFiled(req.user.phone, complaint.ticketId, complaint.title);
  }

  await sendNotification(
    req.user._id,
    `Your complaint ${complaint.ticketId} has been filed successfully.`,
    'success',
    complaint._id
  );

  await awardXp(req.user._id, 'file_complaint', { complaintId: complaint._id });

  const complaintCount = await Complaint.countDocuments({ user: req.user._id });
  if (complaintCount === 1) {
    await awardXp(req.user._id, 'first_complaint', { complaintId: complaint._id });
  }

  res.status(201).json(complaint);
});

// ─── STEP 3: Assign Ward Officer ──────────────────────────────────────────────
const assignOfficer = asyncHandler(async (req, res) => {
  const { officerName, officerDesignation, officerContact, officerUserId } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  complaint.assignedOfficer = {
    name:        officerName,
    designation: officerDesignation || 'Ward Officer',
    contact:     officerContact || '',
    userId:      officerUserId || null,
  };
  complaint.status = 'officer_assigned';
  complaint.timeline.push({
    status:    'officer_assigned',
    message:   `Ward Officer ${officerName} assigned.`,
    updatedBy: req.user._id,
  });
  await complaint.save();

  await sendNotification(
    complaint.user,
    `Officer ${officerName} has been assigned to your complaint ${complaint.ticketId}.`,
    'info',
    complaint._id
  );

  res.json(complaint);
});

// ─── STEP 4: Assign Field Worker + magic token ────────────────────────────────
const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  const allowedStatuses = ['pending', 'under_review', 'officer_assigned'];
  if (!allowedStatuses.includes(complaint.status)) {
    res.status(400); throw new Error(`Cannot assign worker at status: ${complaint.status}`);
  }

  const worker = await FieldWorker.findById(workerId);
  if (!worker) { res.status(404); throw new Error('Field worker not found'); }

  const token     = complaint.generateMagicToken();
  const magicLink = `${FRONTEND_URL}/worker/upload?token=${token}`;

  complaint.assignedWorker = worker._id;
  complaint.workerPhone    = worker.phone;
  complaint.status         = 'worker_assigned';
  complaint.timeline.push({
    status:    'worker_assigned',
    message:   `Field worker ${worker.name} (${worker.employeeId}) assigned. Details sent.`,
    updatedBy: req.user._id,
  });
  await complaint.save();

  worker.activeComplaints.push(complaint._id);
  await worker.save();

  await notifyWorkerAssigned(worker.phone, complaint, magicLink, token);

  await sendNotification(
    complaint.user,
    `A field worker has been assigned to your complaint ${complaint.ticketId}.`,
    'info',
    complaint._id
  );

  res.json({ message: 'Worker assigned and details sent to the worker.', complaint });
});

// ─── STEP 6: Worker webhook (WhatsApp reply "1" = task accepted) ──────────────
// const workerWebhook = asyncHandler(async (req, res) => {
//   const { From, Body } = req.body;
//   const phone   = From?.replace('whatsapp:', '').trim();
//   const message = Body?.trim();

//   if (message !== '1') return res.status(200).send('OK');

//   const complaint = await Complaint.findOne({ workerPhone: phone, status: 'worker_assigned' });
//   if (!complaint) return res.status(200).send('OK');

//   complaint.status = 'in_progress';
//   complaint.timeline.push({
//     status:  'worker_accepted',
//     message: 'Field worker accepted the task.',
//   });
//   await complaint.save();

//   if (complaint.user) {
//     const worker = await FieldWorker.findById(complaint.assignedWorker);

//     await sendNotification(
//       complaint.user,
//       `Field worker ${worker?.name || 'Field staff'} is on the way for ${complaint.ticketId}.`,
//       'info',
//       complaint._id
//     );
//   }

//   res.status(200).send('OK');
// });

// ─── STEP 5 (new): Worker accepts task via magic link page ────────────────────
const workerAcceptTask = asyncHandler(async (req, res) => {
  const { token } = req.query; // passed from the magic link URL

  const complaint = await Complaint.findOne({ magicToken: token });
  if (!complaint || !complaint.isMagicTokenValid(token)) {
    res.status(400); throw new Error('Invalid or expired link.');
  }
  if (complaint.status !== 'worker_assigned') {
    res.status(400); throw new Error(`Cannot accept at status: ${complaint.status}`);
  }

  complaint.status = 'in_progress';
  complaint.timeline.push({
    status:  'in_progress',
    message: 'Field worker accepted the task.',
  });
  await complaint.save();

  if (complaint.user) {
    const worker = await FieldWorker.findById(complaint.assignedWorker);
    await sendNotification(
      complaint.user,
      `Field worker ${worker?.name || 'Field staff'} is on the way for ${complaint.ticketId}.`,
      'info',
      complaint._id
    );
  }

  res.status(200).json({ message: 'Task accepted. You can now upload the proof photo.' });
});

// ─── STEP 7: Magic upload (worker uploads resolution photo via link) ───────────
const magicUpload = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) { res.status(400); throw new Error('Token required'); }

  const complaint = await Complaint.findOne({ magicToken: token });
  if (!complaint || !complaint.isMagicTokenValid(token)) {
    res.status(400); throw new Error('Invalid or expired upload link.');
  }
  if (!req.file) { res.status(400); throw new Error('Photo upload required'); }

  // ✅ FIX: prefer Cloudinary secure_url, fall back to path
  complaint.resolutionImage  = req.file.secure_url || req.file.path;
  complaint.magicToken       = null;
  complaint.magicTokenExpiry = null;
  complaint.status           = 'in_progress';
  complaint.timeline.push({
    status:  'in_progress',
    message: 'Field worker uploaded proof photo. Awaiting officer review.',
  });
  await complaint.save();

  if (complaint.assignedOfficer?.userId) {
    await sendNotification(
      complaint.assignedOfficer.userId,
      `Proof photo uploaded for ${complaint.ticketId}. Please review and resolve.`,
      'info',
      complaint._id
    );
  }

  res.json({ message: 'Proof uploaded successfully. Officer has been notified.' });
});

// ─── STEP 8: Resolve complaint ────────────────────────────────────────────────
const resolveComplaint = asyncHandler(async (req, res) => {
  const { resolutionNote } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  complaint.status         = 'resolved';
  complaint.resolutionNote = resolutionNote || '';
  complaint.resolvedBy     = req.user._id;
  complaint.resolvedAt     = new Date();
  complaint.timeline.push({
    status:    'resolved',
    message:   resolutionNote || 'Issue resolved by Ward Officer.',
    updatedBy: req.user._id,
  });
  await complaint.save();

  await awardXp(complaint.user, 'complaint_resolved', { complaintId: complaint._id });

  const user = await User.findById(complaint.user);

  if (user?.phone) {
    await notifyCitizenComplaintResolved(user.phone, complaint.ticketId, complaint.resolutionNote);
  }

  await sendNotification(
    complaint.user,
    `Your complaint ${complaint.ticketId} has been resolved! Please rate the service.`,
    'success',
    complaint._id
  );

  res.json(complaint);
});

// ─── STEP 9: Citizen rates the resolution ─────────────────────────────────────
const rateComplaint = asyncHandler(async (req, res) => {
  const { rating, note } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400); throw new Error('Rating must be between 1 and 5.');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  if (complaint.status !== 'resolved') {
    res.status(400); throw new Error('Can only rate resolved complaints.');
  }

  complaint.citizenRating = rating;
  complaint.ratingNote    = note || '';

  if (rating >= 4) {
    complaint.status = 'closed';
    complaint.timeline.push({
      status:    'closed',
      message:   `Citizen rated ${rating}★ — complaint closed.`,
      updatedBy: complaint.user,
    });
  } else {
    complaint.status          = 'escalated';
    complaint.escalationCount = (complaint.escalationCount || 0) + 1;
    complaint.timeline.push({
      status:    'escalated',
      message:   `Citizen rated ${rating}★ — escalated for re-review.`,
      updatedBy: complaint.user,
    });

    if (complaint.assignedOfficer?.userId) {
      await sendNotification(
        complaint.assignedOfficer.userId,
        `Complaint ${complaint.ticketId} has been escalated. Citizen rated ${rating}★.`,
        'error',
        complaint._id
      );
    }
  }

  await complaint.save();

  await awardXp(complaint.user, 'rate_feedback', { complaintId: complaint._id });

  res.json(complaint);
});

// ─── Legacy: manual status update (admin / authority override) ────────────────
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  complaint.status = status;
  complaint.timeline.push({
    status,
    message:   message || 'Status updated.',
    updatedBy: req.user._id,
  });
  await complaint.save();

  res.json(complaint);
});

// ─── Get my complaints (citizen) — enriched with vibhag authority ─────────────
const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ user: req.user._id })
    .populate('assignedWorker', 'name phone employeeId')
    .sort({ createdAt: -1 });

  const unassignedVibhags = [
    ...new Set(
      complaints
        .filter(c => !c.assignedOfficer?.name && c.vibhag)
        .map(c => c.vibhag)
    ),
  ];

  const authorities = unassignedVibhags.length
    ? await User.find({
        role:   'local_authority',
        vibhag: { $in: unassignedVibhags },
      }).select('name designation vibhag phone')
    : [];

  const authorityByVibhag = {};
  for (const auth of authorities) {
    if (!authorityByVibhag[auth.vibhag]) {
      authorityByVibhag[auth.vibhag] = {
        name:        auth.name,
        designation: auth.designation || 'Ward Officer',
        contact:     auth.phone || null,
      };
    }
  }

  const enriched = complaints.map(c => {
    const obj = c.toObject();
    if (!obj.assignedOfficer?.name && obj.vibhag && authorityByVibhag[obj.vibhag]) {
      obj._vibhagAuthority = authorityByVibhag[obj.vibhag];
    }
    return obj;
  });

  res.json(enriched);
});

// ─── Get all complaints (authority / admin view) ──────────────────────────────
const getComplaints = asyncHandler(async (req, res) => {
  const { status, vibhag } = req.query;
  const query = {};
  if (status) query.status = status;

  if (req.user.role === 'local_authority' && req.user.vibhag) {
    query.vibhag = req.user.vibhag;
  } else if (vibhag) {
    query.vibhag = vibhag;
  }

  const complaints = await Complaint.find(query)
    .populate('user',           'name email phone')
    .populate('assignedWorker', 'name phone employeeId')
    .sort({ slaDeadline: 1 });

  res.json(complaints);
});

// ─── Get single complaint by ID ───────────────────────────────────────────────
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user',                   'name email phone')
    .populate('assignedWorker',         'name employeeId phone vibhag')
    .populate('assignedOfficer.userId', 'name email');

  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  res.json(complaint);
});

export {
  createComplaint,
  assignOfficer,
  assignWorker,
  workerAcceptTask,
  magicUpload,
  resolveComplaint,
  rateComplaint,
  updateComplaintStatus,
  getMyComplaints,
  getComplaints,
  getComplaintById,
};