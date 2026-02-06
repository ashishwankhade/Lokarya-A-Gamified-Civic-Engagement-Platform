import mongoose from 'mongoose';

const activitySchema = mongoose.Schema(
  {
    ngo: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    
    // 1. Basic Info
    title: { type: String, required: true },
    description: { type: String, required: true },
    banner: { type: String }, // Cloudinary Image URL
    
    // 2. Logistics
    category: { 
      type: String, 
      enum: ['Environment', 'Education', 'Health', 'Social', 'Animal Welfare'],
      required: true 
    },
    pointsReward: { type: Number, default: 50 },
    
    // 3. Time & Deadlines
    date: { type: Date, required: true }, // Event Date
    deadline: { type: Date, required: true }, // Signup Deadline
    
    // 4. Location (Standardized)
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },

    // 5. Capacity Management
    maxParticipants: { type: Number, required: true },
    
    // 6. Instructions
    requirements: [{ type: String }], // e.g., ["Bring Gloves", "Wear Red"]
    contactInfo: { type: String, required: true }, // Phone/Email

    status: { type: String, enum: ['open', 'closed', 'completed'], default: 'open' },
    
    // Participants
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        proof: { type: String },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;