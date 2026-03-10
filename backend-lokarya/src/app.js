/**
 * app.js  —  Lokarya Backend
 */

import express      from 'express';
import cors         from 'cors';
import dotenv       from 'dotenv';
import passport     from 'passport';
import cookieParser from 'cookie-parser';
import helmet       from 'helmet';
import rateLimit    from 'express-rate-limit';
import hpp          from 'hpp';
import path         from 'path';
import { fileURLToPath } from 'url';

import './config/passport.js';

// ── ROUTES ───────────────────────────────────────────────────────────────────
import authRoutes         from './routes/authRoutes.js';
import complaintRoutes    from './routes/complaintRoutes.js';
import activityRoutes     from './routes/activityRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes        from './routes/adminRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import fieldWorkerRoutes  from './routes/fieldWorkerRoutes.js';

// ── SEEDS (re-exported so server.js can call them after DB connects) ─────────
import { seedXpRules } from './models/XpRule.js';
import { seedBadges }  from './models/Badge.js';   // ← ADDED
export { seedXpRules, seedBadges };                // ← ADDED seedBadges to export

// ── ERROR MIDDLEWARE ─────────────────────────────────────────────────────────
import { errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────
app.use(helmet());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL  || 'http://localhost:5173',
  process.env.FRONTEND_URL2 || 'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// ─── BODY & COOKIE PARSERS ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── NOSQL INJECTION SANITIZER ────────────────────────────────────────────────
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

app.use((req, _res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  next();
});

// ─── HTTP PARAMETER POLLUTION ─────────────────────────────────────────────────
app.use(hpp());

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many admin requests.' },
});

app.use('/api/',              generalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin',         adminLimiter);

// ─── PASSPORT ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── STATIC UPLOADS ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/complaints',    complaintRoutes);
app.use('/api/activities',    activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/gamification',  gamificationRoutes);
app.use('/api/field-workers', fieldWorkerRoutes);

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({ success: true, message: 'Lokarya API is running 🚀', env: process.env.NODE_ENV })
);
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── ERROR HANDLER (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
