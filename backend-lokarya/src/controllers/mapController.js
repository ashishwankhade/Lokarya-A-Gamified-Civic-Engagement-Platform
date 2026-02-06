import asyncHandler  from '../utils/asyncHandler.js';
import Complaint from '../models/Complaint.js';

// @desc    Get lightweight GeoJSON data for Maps
// @route   GET /api/map/complaints
// @access  Public (or Private depending on your privacy preference)
const getMapData = asyncHandler(async (req, res) => {
  const { category, status } = req.query;

  // Build Filter Object
  let filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;

  // Fetch only necessary fields to keep it fast
  const complaints = await Complaint.find(filter)
    .select('location title category status supportCount createdAt');

  // Convert to GeoJSON Format (Standard for Mapbox/Google Maps)
  const features = complaints.map((complaint) => {
    // Determine marker color based on status
    let markerColor = 'red'; // default pending
    if (complaint.status === 'in_progress') markerColor = 'orange';
    if (complaint.status === 'resolved') markerColor = 'green';

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [complaint.location.lng, complaint.location.lat], // GeoJSON is [Lng, Lat]
      },
      properties: {
        id: complaint._id,
        title: complaint.title,
        category: complaint.category,
        status: complaint.status,
        color: markerColor,
        supportCount: complaint.supportCount, // Useful for heatmap weighting
      },
    };
  });

  res.json({
    type: 'FeatureCollection',
    count: features.length,
    features: features,
  });
});

export { getMapData };