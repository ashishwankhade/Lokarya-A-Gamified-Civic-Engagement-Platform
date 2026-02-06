import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport'; // 1. Import Passport
import './config/passport.js';   // 2. Import Passport configuration
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js'; // Import
import complaintRoutes from './routes/complaintRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // 1. Import Admin Routes
import mapRoutes from './routes/mapRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';


// Load environment variables here (so they are available throughout the app)
dotenv.config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Allows parsing JSON body
// Initialize Passport Middleware
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