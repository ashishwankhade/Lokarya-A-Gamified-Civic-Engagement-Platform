import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv'; // 1. Import dotenv

// 2. Load environment variables BEFORE connecting to DB
dotenv.config(); 

// Debugging: Check if the URI is actually loaded (Remove this line later)
console.log("Mongo URI:", process.env.MONGO_URI); 

const PORT = process.env.PORT || 5000;

// 3. Connect to Database
connectDB();

// 4. Start the Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});