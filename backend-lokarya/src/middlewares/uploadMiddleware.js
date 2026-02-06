import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// 1. Load Environment Variables
dotenv.config();

// --- DEBUG: Check if Credentials are Loaded ---
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;

if (!cloudName || !apiKey) {
    console.error("❌ FATAL ERROR: Cloudinary credentials missing in .env file!");
    console.error("   - CLOUDINARY_CLOUD_NAME:", cloudName ? "OK" : "MISSING");
    console.error("   - CLOUDINARY_API_KEY:", apiKey ? "OK" : "MISSING");
} else {
    console.log("✅ Cloudinary Configured for:", cloudName);
}

// 2. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 3. Configure Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lokarya_uploads',
    // FIX: Added 'webp' and 'heic' (iPhone) to prevent format errors
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic'], 
    // transformation: [{ width: 1000, crop: "limit" }] // Optional resizing
  },
});

// 4. Initialize Multer with Limits
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

export default upload;