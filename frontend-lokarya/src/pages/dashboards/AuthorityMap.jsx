import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';

// --- 1. Fix Leaflet Default Icon Issue in React ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom Icons for Status
const pendingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const resolvedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- 2. Helper Component to Recenter Map ---
const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const AuthorityMap = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'

  // Default Center (e.g., Nagpur, India) - Update this to your city's coordinates
  const defaultCenter = [21.1458, 79.0882]; 

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get('/complaints'); 
        // Filter out complaints that don't have valid coordinates
        const validData = data.filter(c => c.location && c.location.lat && c.location.lng);
        setComplaints(validData);
      } catch (error) {
        console.error("Map Data Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const filteredComplaints = complaints.filter(c => 
    filter === 'all' ? true : c.status === filter
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <PageHeader 
        title="Live Incident Map" 
        subtitle="Geospatial view of reported civic issues."
        action={
          <div className="flex bg-white shadow-sm border border-gray-200 rounded-lg p-1">
             <button 
               onClick={() => setFilter('all')}
               className={`px-3 py-1 text-xs font-bold rounded ${filter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
             >
               All
             </button>
             <button 
               onClick={() => setFilter('pending')}
               className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${filter === 'pending' ? 'bg-red-500 text-white' : 'text-gray-500'}`}
             >
               Pending
             </button>
             <button 
               onClick={() => setFilter('resolved')}
               className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${filter === 'resolved' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
             >
               Resolved
             </button>
          </div>
        }
      />

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading Map Data...</div>
        ) : (
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
          >
            {/* Dark Mode Map Tiles (Optional style) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Render Pins */}
            {filteredComplaints.map((complaint) => (
              <Marker 
                key={complaint._id} 
                position={[complaint.location.lat, complaint.location.lng]}
                icon={complaint.status === 'resolved' ? resolvedIcon : pendingIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {complaint.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-sm text-gray-800 mb-1">{complaint.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{complaint.description}</p>
                    
                    {complaint.image && (
                      <div className="w-full h-24 bg-gray-100 rounded mb-2 overflow-hidden">
                        <img src={complaint.image} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="text-xs font-medium text-[#0f4c75]">
                      🔥 {complaint.upvotes?.length || 0} Upvotes
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Optional: Recenter map if first complaint exists */}
            {filteredComplaints.length > 0 && (
              <RecenterAutomatically 
                lat={filteredComplaints[0].location.lat} 
                lng={filteredComplaints[0].location.lng} 
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default AuthorityMap;