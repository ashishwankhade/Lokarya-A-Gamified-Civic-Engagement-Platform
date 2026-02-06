import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'in_progress', 'resolved', 'rejected'] 
  },
  date: { type: Date, default: Date.now },
  message: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const complaintSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Garbage', 'Roads', 'Water', 'Electricity', 'Other'],
      required: true,
    },
    
    // UPDATED LOCATION STRUCTURE
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },

    image: { type: String }, // Initial complaint image
    
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },

    // --- UPDATED TRACKING FIELDS (Simple Text Assignment) ---
    // Added 'contact' field here
    assignedOfficer: {
      name: { type: String },
      designation: { type: String },
      contact: { type: String } // Phone number or email
    },
    
    resolutionImage: { type: String }, // The "After" photo (Proof of resolution)
    
    // --- DUPLICATE DETECTION / UPVOTING ---
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    supportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    supportCount: { type: Number, default: 1 },

    timeline: [timelineSchema],
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Middleware to add initial timeline event
complaintSchema.pre('save', function (next) {
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({
      status: 'pending',
      message: 'Complaint filed successfully',
      updatedBy: this.user
    });
    
    // Ensure creator is in supportedBy list
    if (!this.supportedBy.includes(this.user)) {
      this.supportedBy.push(this.user);
    }
    // Ensure creator is in upvotes list
    if (!this.upvotes.includes(this.user)) {
      this.upvotes.push(this.user);
    }
  }
  next();
});

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;