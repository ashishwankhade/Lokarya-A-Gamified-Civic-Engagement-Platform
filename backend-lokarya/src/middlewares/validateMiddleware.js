import { body, validationResult } from 'express-validator';

// ─── Reusable error formatter ─────────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const validateRegister = [
  body('name')
    .trim()
    .escape()                          // FIX: sanitize XSS characters e.g. <script>
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8  }).withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }).withMessage('Password must be under 128 characters') // FIX: bcrypt DoS prevention
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),

  body('role')
    .optional()
    .isIn(['citizen', 'ngo_admin', 'local_authority'])
    .withMessage('Invalid role'),

  handleValidationErrors,
];

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const validateLogin = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password too long'), // FIX: bcrypt DoS prevention

  handleValidationErrors,
];

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .escape()                          // FIX: sanitize XSS characters
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('location')
    .optional()
    .trim()
    .escape()                          // FIX: sanitize XSS characters
    .isLength({ max: 100 }).withMessage('Location must be under 100 characters'),

  body('password')
    .optional()
    .isLength({ min: 8  }).withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }).withMessage('Password must be under 128 characters') // FIX: bcrypt DoS prevention
    .matches(/[A-Z]/).withMessage('Must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain lowercase letter')
    .matches(/\d/).withMessage('Must contain a number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Must contain a special character'),

  handleValidationErrors,
];
