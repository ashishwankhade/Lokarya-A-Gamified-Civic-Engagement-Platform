/**
 * server.js  —  Lokarya Backend entry point
 */

import dotenv from 'dotenv';
dotenv.config();

import app       from './app.js';
import connectDB from './config/db.js';
import { seedXpRules } from './models/XpRule.js';
import { seedBadges }  from './models/Badge.js';   // ← ADDED

// Debugging — remove in production
if (process.env.NODE_ENV !== 'production') {
  console.log('Mongo URI loaded:', !!process.env.MONGO_URI);
}

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    await seedXpRules();   // seeds 11 XP rules on first boot
    await seedBadges();    // ← ADDED — seeds 15 badges on first boot

    app.listen(PORT, () => {
      console.log(
        `✅  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (err) {
    console.error('❌  Startup failed:', err.message);
    process.exit(1);
  }
};

start();
