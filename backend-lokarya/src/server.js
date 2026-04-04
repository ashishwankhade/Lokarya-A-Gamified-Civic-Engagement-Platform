/**
 * server.js  —  Lokarya Backend entry point
 */
import './config/env.js';      // ← MUST be the very first import — loads .env before everything else

import app        from './app.js';
import connectDB  from './config/db.js';
import { seedXpRules } from './models/XpRule.js';
import { seedBadges }  from './models/Badge.js';

if (process.env.NODE_ENV !== 'production') {
  console.log('Mongo URI loaded:', !!process.env.MONGO_URI);
  console.log('Cloudinary loaded:', !!process.env.CLOUDINARY_CLOUD_NAME); // ← add this check
}

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await seedXpRules();
    await seedBadges();

    app.listen(PORT, () => {
      console.log(`✅  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌  Startup failed:', err.message);
    process.exit(1);
  }
};

start();