/**
 * privilegedAuthController.js
 * Path: backend-lokarya/src/controllers/privilegedAuthController.js
 *
 * Creates ngo_admin and local_authority accounts.
 * Citizens self-register via /api/auth/register.
 * These roles are admin-provisioned only — no self-registration.
 *
 * Routes (all protected, super_admin only):
 *   POST   /api/admin/users/create          ← createPrivilegedUser
 *   GET    /api/admin/users/create/vibhags  ← getVibhags  (dropdown data)
 *
 * IMPORTANT: register this route in adminRoutes.js BEFORE router.get('/users/:id')
 * so the static /users/create path is not swallowed by the :id param.
 */

import asyncHandler from '../utils/asyncHandler.js';
import User         from '../models/User.js';
import { sendNotification } from '../utils/notificationSystem.js';

// ── NAGPUR VIBHAGS ────────────────────────────────────────────────────────────
// Single source of truth — used by this controller and surfaced to the frontend
export const NAGPUR_VIBHAGS = [
  'Dharampeth', 'Lakadganj', 'Mangalwari', 'Sadar', 'Ashi Nagar',
  'Hanuman Nagar', 'Gandhibagh', 'Nehru Nagar', 'Sukrawari',
  'Besa', 'Hingna', 'Kamptee', 'Kalmeshwar', 'Narkhed',
  'Ramtek', 'Umred', 'Katol', 'Mauda', 'Parseoni',
];

// ── VALIDATION HELPERS ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/admin/users/create/vibhags
// Returns the vibhag list so the frontend doesn't hardcode it.
// ═════════════════════════════════════════════════════════════════════════════
export const getVibhags = asyncHandler(async (req, res) => {
  res.json(NAGPUR_VIBHAGS);
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/admin/users/create
//
// Body (ngo_admin):
//   { name, email, password, role: 'ngo_admin', organizationName, phone? }
//
// Body (local_authority):
//   { name, email, password, role: 'local_authority', vibhag, department?, phone? }
// ═════════════════════════════════════════════════════════════════════════════
export const createPrivilegedUser = asyncHandler(async (req, res) => {
  const {
    name, email, password, role,
    organizationName,   // ngo_admin   — required
    vibhag,             // local_authority — required
    department,         // local_authority — optional
    phone,              // both — optional
  } = req.body;

  // ── 1. Basic presence checks ──────────────────────────────────────────────
  if (!name?.trim())  { res.status(400); throw new Error('name is required.');     }
  if (!email?.trim()) { res.status(400); throw new Error('email is required.');    }
  if (!password)      { res.status(400); throw new Error('password is required.'); }
  if (!role)          { res.status(400); throw new Error('role is required.');     }

  // ── 2. Role whitelist ─────────────────────────────────────────────────────
  const ALLOWED_ROLES = ['ngo_admin', 'local_authority'];
  if (!ALLOWED_ROLES.includes(role)) {
    res.status(400);
    throw new Error(
      `Only ngo_admin and local_authority can be created here. Received: "${role}".`
    );
  }

  // ── 3. Email format ───────────────────────────────────────────────────────
  if (!EMAIL_RE.test(email.trim())) {
    res.status(400);
    throw new Error('Invalid email address format.');
  }

  // ── 4. Password strength ──────────────────────────────────────────────────
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters.');
  }

  // ── 5. Role-specific required fields ─────────────────────────────────────
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

  // ── 6. Duplicate email ────────────────────────────────────────────────────
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    res.status(409);
    throw new Error(`An account with email "${email}" already exists.`);
  }

  // ── 7. Create — password hashed by User.js pre-save hook (bcrypt 12) ─────
  const userData = {
    name:        name.trim(),
    email:       email.toLowerCase().trim(),
    password,                                 // hashed by pre-save
    role,
    isVerified:  true,                        // admin-provisioned = auto-verified
    isOAuthUser: false,
    xp:          0,
    banned:      false,
    phone:       phone?.trim() || undefined,
  };

  // Role-specific fields
  if (role === 'ngo_admin') {
    userData.organizationName = organizationName.trim();
  }
  if (role === 'local_authority') {
    userData.vibhag     = vibhag.trim();
    userData.department = department?.trim() || undefined;
  }

  const user = await User.create(userData);

  // ── 8. In-app notification ────────────────────────────────────────────────
  const roleLabel = role === 'ngo_admin' ? 'NGO Admin' : 'Local Authority';
  await sendNotification(
    user._id,
    `Welcome to Lokarya! Your ${roleLabel} account has been created by the platform admin. Log in with: ${email}`,
    'success'
  ).catch(() => {}); // non-fatal

  // ── 9. Return (strip password) ────────────────────────────────────────────
  const safe = user.toObject();
  delete safe.password;

  res.status(201).json({
    message: `${roleLabel} account created successfully.`,
    user:    safe,
  });
});
