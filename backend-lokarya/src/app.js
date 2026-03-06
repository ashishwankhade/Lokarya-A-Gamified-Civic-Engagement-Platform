import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import cookieParser from 'cookie-parser'; // <--- Kept this for cookies

import './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import complaintRoutes from './routes/complaintRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// --- MIDDLEWARE ---

// 1. CORS Configuration (CRITICAL for Cookies)
app.use(cors({
  origin: 'http://localhost:5173', // Must match your Frontend URL exactly
  credentials: true // Allows the browser to send the HttpOnly cookie
}));

// 2. Body & Cookie Parsers
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(cookieParser()); // <--- Parses the cookie sent from frontend

// --- INITIALIZE PASSPORT ---
app.use(passport.initialize());

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/map', mapRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gamification', gamificationRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('Lokarya API is running...');
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use(errorHandler);

export default app;