/**
 * privilegedAuthController.js
 * Path: backend-lokarya/src/controllers/privilegedAuthController.js
 */

import asyncHandler from '../utils/asyncHandler.js';
import User         from '../models/User.js';
import { sendNotification } from '../utils/notificationSystem.js';

export const NAGPUR_VIBHAGS = [
  'Dharampeth', 'Lakadganj', 'Mangalwari', 'Sadar', 'Ashi Nagar',
  'Hanuman Nagar', 'Gandhibagh', 'Nehru Nagar', 'Sukrawari',
  'Besa', 'Hingna', 'Kamptee', 'Kalmeshwar', 'Narkhed',
  'Ramtek', 'Umred', 'Katol', 'Mauda', 'Parseoni',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getVibhags = asyncHandler(async (req, res) => {
  res.json(NAGPUR_VIBHAGS);
});

export const createPrivilegedUser = asyncHandler(async (req, res) => {
  const {
    name, email, password, role, phone,

    // ngo_admin fields
    organizationName,
    ngoDescription,
    ngoWebsite,

    // local_authority fields
    vibhag,
    department,
    designation,
  } = req.body;

  // ── 1. Basic presence ────────────────────────────────────────────────────
  if (!name?.trim())  { res.status(400); throw new Error('name is required.');     }
  if (!email?.trim()) { res.status(400); throw new Error('email is required.');    }
  if (!password)      { res.status(400); throw new Error('password is required.'); }
  if (!role)          { res.status(400); throw new Error('role is required.');     }

  // ── 2. Role whitelist ────────────────────────────────────────────────────
  const ALLOWED_ROLES = ['ngo_admin', 'local_authority'];
  if (!ALLOWED_ROLES.includes(role)) {
    res.status(400);
    throw new Error(`Only ngo_admin and local_authority can be created here. Received: "${role}".`);
  }

  // ── 3. Email format ──────────────────────────────────────────────────────
  if (!EMAIL_RE.test(email.trim())) {
    res.status(400);
    throw new Error('Invalid email address format.');
  }

  // ── 4. Password strength ─────────────────────────────────────────────────
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters.');
  }

  // ── 5. Role-specific validation ──────────────────────────────────────────
  if (role === 'ngo_admin' && !organizationName?.trim()) {
    res.status(400);
    throw new Error('organizationName is required for ngo_admin accounts.');
  }

  if (role === 'local_authority') {
    if (!vibhag?.trim()) {
      res.status(400);
      throw new Error('vibhag is required for local_authority accounts.');
    }
    if (!NAGPUR_VIBHAGS.includes(vibhag.trim())) {
      res.status(400);
      throw new Error(`"${vibhag}" is not a valid Nagpur vibhag.`);
    }
  }

  // ── 6. Duplicate email ───────────────────────────────────────────────────
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    res.status(409);
    throw new Error(`An account with email "${email}" already exists.`);
  }

  // ── 7. Build userData ────────────────────────────────────────────────────
  const userData = {
    name:        name.trim(),
    email:       email.toLowerCase().trim(),
    password,
    role,
    isVerified:  true,
    isOAuthUser: false,
    xp:          0,
    banned:      false,
    phone:       phone?.trim() || null,
  };

  // NGO Admin fields
  if (role === 'ngo_admin') {
    userData.organizationName = organizationName.trim();
    if (ngoDescription?.trim()) userData.ngoDescription = ngoDescription.trim();
    if (ngoWebsite?.trim())     userData.ngoWebsite     = ngoWebsite.trim();
  }

  // Local Authority fields
  if (role === 'local_authority') {
    userData.vibhag = vibhag.trim();
    if (department?.trim())  userData.department  = department.trim();
    if (designation?.trim()) userData.designation = designation.trim();
  }

  // ── 8. Create ────────────────────────────────────────────────────────────
  const user = await User.create(userData);

  // ── 9. Notification ──────────────────────────────────────────────────────
  const roleLabel = role === 'ngo_admin' ? 'NGO Admin' : 'Local Authority';
  await sendNotification(
    user._id,
    `Welcome to Lokarya! Your ${roleLabel} account has been created by the platform admin. Log in with: ${email}`,
    'success'
  ).catch(() => {});

  // ── 10. Return (strip password) ──────────────────────────────────────────
  const safe = user.toObject();
  delete safe.password;

  res.status(201).json({
    message: `${roleLabel} account created successfully.`,
    user:    safe,
  });
});