import asyncHandler from '../utils/asyncHandler.js';
import Complaint from '../models/Complaint.js';
import { getDistanceFromLatLonInM } from '../utils/locationUtils.js';
import { sendNotification } from '../utils/notificationSystem.js';

// --- NEW GAMIFICATION IMPORTS ---
import gamificationService from '../services/gamificationService.js';
import { POINTS } from '../config/gamificationRules.js';

// @desc    Create a new complaint OR Upvote existing one
// @route   POST /api/complaints
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, location: locationString } = req.body;
  
  // 1. Parse Location
  let location = {};
  try {
    const parsedLoc = typeof locationString === 'string' ? JSON.parse(locationString) : locationString;
    location = { 
      address: parsedLoc.address, 
      lat: Number(parsedLoc.lat), 
      lng: Number(parsedLoc.lng) 
    };

    if (isNaN(location.lat) || isNaN(location.lng)) {
       throw new Error("Invalid Coordinates");
    }
  } catch (e) {
    res.status(400);
    throw new Error('Invalid location format.');
  }

  // 2. Get Image
  const image = req.file ? req.file.path : null;

  // --- DUPLICATE CHECK ---
  const DUPLICATE_RADIUS_METERS = 50; 
  const activeComplaints = await Complaint.find({
    category: category,
    status: { $in: ['pending', 'in_progress'] }
  });

  let duplicateFound = null;

  if (location.lat && location.lng) {
      for (let complaint of activeComplaints) {
        if(complaint.location && complaint.location.lat && complaint.location.lng) {
             const distance = getDistanceFromLatLonInM(
              location.lat, location.lng,
              complaint.location.lat, complaint.location.lng
            );
            if (distance < DUPLICATE_RADIUS_METERS) {
              duplicateFound = complaint;
              break; 
            }
        }
      }
  }

  // --- HANDLE DUPLICATE ---
  if (duplicateFound) {
    if (duplicateFound.supportedBy.includes(req.user._id)) {
      res.status(400);
      throw new Error("You have already reported/supported this issue.");
    }

    duplicateFound.supportedBy.push(req.user._id);
    if (!duplicateFound.upvotes.includes(req.user._id)) {
       duplicateFound.upvotes.push(req.user._id);
    }
    duplicateFound.supportCount = (duplicateFound.supportCount || 0) + 1;
    
    duplicateFound.timeline.push({
      status: duplicateFound.status,
      message: `Priority increased! Verified by another citizen.`,
      updatedBy: req.user._id,
      date: Date.now()
    });

    await duplicateFound.save();
    
    // Reward for verification (Use Service)
    await gamificationService.awardPoints(req.user._id, 5, "Verified existing complaint");

    return res.status(200).json({ 
      message: "Issue verified! We added your vote to prioritize it.", 
      isDuplicate: true,
      complaint: duplicateFound 
    });
  }
  
  // --- CREATE NEW ---
  const complaint = await Complaint.create({
    user: req.user._id,
    title,
    description,
    category,
    location, 
    image, 
    supportedBy: [req.user._id],
    upvotes: [req.user._id], 
    status: 'pending'
  });

  // Reward for new report (Use Service & Config)
  await gamificationService.awardPoints(
      req.user._id, 
      POINTS.REPORT_ISSUE, 
      "Reported new issue"
  );

  res.status(201).json(complaint);
});

// @desc    Get My Complaints
// @route   GET /api/complaints/my
const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(complaints);
});

// @desc    Get All Complaints
// @route   GET /api/complaints
const getAllComplaints = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let query = {};
  if (status) query.status = status;

  const complaints = await Complaint.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
    
  res.json(complaints);
});

// @desc    Update Status / Assign / Resolve
// @route   PUT /api/complaints/:id/status
const updateComplaintStatus = asyncHandler(async (req, res) => {

  const { status, message, officerName, officerRole, officerContact } = req.body;
  
  // 1. Find Complaint
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const previousStatus = complaint.status;

  // 2. Handle Image Upload (Resolution Proof)
  if (req.file) {
     complaint.resolutionImage = req.file.path; 
  }

  // 3. Validation: Require Proof for Resolution
  if (status === 'resolved' && !complaint.resolutionImage) {
      res.status(400);
      throw new Error("You must upload an image proof to mark this as Resolved.");
  }

  // 4. Update Status
  if (status) {
      complaint.status = status;
  }

  // 5. Handle Officer Assignment
  if (officerName) {
     complaint.assignedOfficer = {
       name: officerName,
       designation: officerRole || "Field Officer",
       contact: officerContact || ""
     };
  }

  // 6. Timeline Logic
  let timelineMsg = message;
  if(!timelineMsg) {
      if(status === 'in_progress') timelineMsg = `Assigned to ${officerName || 'Field Staff'} for inspection.`;
      if(status === 'resolved') timelineMsg = "Issue resolved and verified by authority.";
      if(status === 'rejected') timelineMsg = "Complaint rejected after review.";
  }

  complaint.timeline.push({
    status: status || complaint.status,
    message: timelineMsg || "Status updated",
    updatedBy: req.user._id,
    date: Date.now()
  });

  // 7. Save to DB
  await complaint.save();

  // 8. Notifications & Rewards
  if (status === 'resolved' && previousStatus !== 'resolved') {
    
    // Reward for resolution (Use Service & Config)
    await gamificationService.awardPoints(
        complaint.user, 
        POINTS.ISSUE_RESOLVED, 
        `Complaint Resolved: ${complaint.category}`
    );

    await sendNotification(
      complaint.user,
      `Success! Your ${complaint.category} report has been resolved.`,
      'success',
      complaint._id
    );
  } 
  else if (status === 'in_progress' && previousStatus !== 'in_progress') {
     await sendNotification(
      complaint.user,
      `${officerName || 'An officer'} is now working on your complaint.`,
      'info',
      complaint._id
    );
  }
  else if (status === 'rejected') {
     await sendNotification(
      complaint.user,
      `Update: Your complaint was reviewed and closed/rejected.`,
      'error',
      complaint._id
    );
  }

  // 9. Manual Response Construction
  const responsePayload = {
      _id: complaint._id,
      title: complaint.title,
      description: complaint.description,
      status: complaint.status,
      category: complaint.category,
      location: complaint.location,
      image: complaint.image,
      resolutionImage: complaint.resolutionImage,
      assignedOfficer: complaint.assignedOfficer,
      timeline: complaint.timeline,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt
  };

  res.status(200).json(responsePayload);
});

export { 
    createComplaint, 
    getMyComplaints, 
    getAllComplaints, 
    updateComplaintStatus 
};