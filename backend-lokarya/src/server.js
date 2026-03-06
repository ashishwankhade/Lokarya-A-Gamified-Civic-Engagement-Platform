import dotenv from 'dotenv';
// Load env vars immediately so imports below can use them if needed
dotenv.config(); 

import app from './app.js';
import connectDB from './config/db.js';

// Debugging: Remove this in production
if (process.env.NODE_ENV !== 'production') {
  console.log("Mongo URI loaded:", !!process.env.MONGO_URI); 
}

const PORT = process.env.PORT || 5000;

// 1. Connect to Database
connectDB();

// 2. Start the Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});