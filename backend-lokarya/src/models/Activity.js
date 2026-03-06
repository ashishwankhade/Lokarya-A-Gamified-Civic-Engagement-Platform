import mongoose from 'mongoose';

const activitySchema = mongoose.Schema(
  {
    ngo: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    banner: { 
      type: String, 
      default: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600' 
    },
    category: { 
      type: String, 
      enum: ['Environment', 'Education', 'Healthcare', 'Social', 'Animal Welfare', 'Sanitation', 'Disaster Relief'],
      required: true 
    },
    pointsReward: { type: Number, default: 50, min: 0 },
    date: { type: Date, required: true },
    deadline: { type: Date, required: true },
    location: {
      name: { type: String, required: true },
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number }
    },
    maxParticipants: { type: Number, required: true, default: 10 },
    requirements: [{ type: String }],
    contactInfo: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['open', 'closed', 'completed'], 
      default: 'open' 
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

activitySchema.virtual('volunteerCount').get(function() {
  return this.participants.filter(p => p.status === 'approved').length;
});

activitySchema.virtual('spotsLeft').get(function() {
  const active = this.participants.filter(p => p.status !== 'rejected');
  return Math.max(0, this.maxParticipants - active.length);
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;