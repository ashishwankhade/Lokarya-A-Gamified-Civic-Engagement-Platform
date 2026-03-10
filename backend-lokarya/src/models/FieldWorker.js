import mongoose from 'mongoose';

const fieldWorkerSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    phone:      { type: String, required: true }, // WhatsApp number — used in Step 5
    vibhag: {
      type: String,
      enum: [
        'Dharampeth','Dhantoli','Nehru Nagar','Gandhi Nagar','Hanuman Nagar',
        'Mangalwari','Ashi Nagar','Satranjipura','Lakadganj',
        'East Nagpur','West Nagpur','South Nagpur','North Nagpur','Other',
      ],
      required: true,
    },
    // The Ward Officer (Authority user) who manages this worker
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    isActive: { type: Boolean, default: true },

    // Track current workload
    activeComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  },
  { timestamps: true }
);

const FieldWorker = mongoose.model('FieldWorker', fieldWorkerSchema);
export default FieldWorker;
