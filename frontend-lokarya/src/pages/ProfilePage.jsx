import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Mail, Target, AlertTriangle, Zap, 
  Award, ChevronRight, Share2, AlertCircle, Loader2, Camera, X, Save
} from 'lucide-react';
import api from '../api/axios'; 
import { toast } from 'react-toastify';

// --- EDIT MODAL COMPONENT ---
const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    location: user.location || '',
  });
  const [preview, setPreview] = useState(user.image);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('location', formData.location);
    if (file) {
      data.append('avatar', file);
    }

    try {
      // Force Content-Type undefined so browser sets boundary for Multipart
      const res = await api.put('/auth/profile', data, {
        headers: { "Content-Type": undefined }
      });
      
      onUpdate(res.data); // Update parent state immediately
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-black text-gray-800 text-lg">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer w-28 h-28">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-100 group-hover:border-teal-100 transition-colors">
                 <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={28} />
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
            </div>
            <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-wide">Tap photo to change</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none font-bold text-gray-800 focus:ring-2 focus:ring-teal-500 transition-all" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none font-bold text-gray-800 focus:ring-2 focus:ring-teal-500 transition-all" 
              placeholder="e.g. Nagpur, India"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#0f4c75] text-white font-bold rounded-xl mt-4 hover:bg-[#0b3a5b] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE ---
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('all'); 
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false); // Modal State

  // --- 1. FETCH DATA ---
  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
    } catch (error) {
      console.error("Profile Load Error", error);
      toast.error("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Update profile locally after edit without refetching
  const handleLocalUpdate = (updatedData) => {
    setProfile(prev => ({
      ...prev,
      name: updatedData.name,
      location: updatedData.location,
      avatar: updatedData.avatar 
    }));
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
      <Loader2 className="animate-spin mb-2 text-[#0f4c75]" size={32} />
      <p className="font-medium animate-pulse">Loading your profile...</p>
    </div>
  );

  if (!profile) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Profile not found.</div>;

  // --- 2. DATA MAPPING ---
  const USER = {
    name: profile.name,
    role: (profile.role || 'Citizen').replace('_', ' '), 
    level: profile.level || 1,
    currentXP: profile.currentXP || 0,
    nextLevelXP: profile.nextLevelXP || 1000,
    location: profile.location || "Nagpur, India",
    email: profile.email,
    // Use uploaded avatar OR Fallback generator
    image: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=0d9488&color=fff&size=128`
  };

  const STATS = [
    { label: "Missions", value: profile.stats?.missions || 0, icon: <Target size={18} />, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Reports", value: profile.stats?.reports || 0, icon: <AlertTriangle size={18} />, color: "text-red-500", bg: "bg-red-50" },
    { label: "Impact Score", value: profile.stats?.impactScore || "100%", icon: <Zap size={18} />, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  const ALL_POSSIBLE_BADGES = [
    { name: "First Step", icon: "🏳️" },
    { name: "Reporter", icon: "📢" },
    { name: "Volunteer", icon: "🤝" },
    { name: "Savior", icon: "🛡️" }, 
    { name: "Star", icon: "⭐" }, 
  ];

  const BADGES = ALL_POSSIBLE_BADGES.map((badge, index) => ({
    id: index,
    ...badge,
    unlocked: profile.badges?.some(b => b.name === badge.name) || false 
  }));

  const HISTORY = profile.history || [];

  // Circle Math
  const progressPercent = Math.min((USER.currentXP / USER.nextLevelXP) * 100, 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      
      {/* BACKGROUND */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 h-72 relative rounded-b-[3rem] shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-48 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: ID CARD --- */}
          <div className="md:col-span-4 lg:col-span-3">
             <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 text-center sticky top-24">
                
                {/* Avatar Circle */}
                <div className="relative w-40 h-40 mx-auto mb-4 group cursor-pointer" onClick={() => setIsEditOpen(true)}>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="50" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="80" cy="80" r="50" 
                      stroke="#0d9488" strokeWidth="8" fill="transparent" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={strokeDashoffset} 
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                       <img src={USER.image} alt={USER.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-white shadow-sm whitespace-nowrap">
                    LVL {USER.level}
                  </div>
                  
                  {/* Quick Edit Icon on Hover */}
                  <div className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:text-teal-600 transform scale-90 group-hover:scale-100">
                    <Camera size={16} />
                  </div>
                </div>

                <h2 className="text-xl font-black text-gray-900">{USER.name}</h2>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-wide mb-6">{USER.role}</p>

                <div className="space-y-3 text-left">
                   <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                      <MapPin size={16} className="text-teal-500" /> {USER.location}
                   </div>
                   <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors truncate">
                      <Mail size={16} className="text-teal-500 shrink-0" /> <span className="truncate">{USER.email}</span>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                   <button 
                      onClick={() => setIsEditOpen(true)}
                      className="flex-1 bg-[#0f4c75] text-white py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:bg-[#0b3a5b] transition-all cursor-pointer"
                   >
                     Edit Profile
                   </button>
                   <button className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 cursor-pointer hover:text-[#0f4c75] transition-colors">
                     <Share2 size={18}/>
                   </button>
                </div>
             </div>
          </div>

          {/* --- RIGHT COLUMN: DASHBOARD FEED --- */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
               {STATS.map((stat, idx) => (
                 <motion.div 
                   key={idx}
                   whileHover={{ y: -2 }}
                   className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-md transition-shadow"
                 >
                    <div className={`p-2 rounded-full ${stat.bg} ${stat.color}`}>
                       {stat.icon}
                    </div>
                    <div className="text-center">
                       <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
                       <p className="text-[10px] uppercase font-bold text-gray-400">{stat.label}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Badges Collection */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <Award className="text-yellow-500" size={20} /> Achievements
                  </h3>
               </div>
               
               <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide cursor-pointer">
                  {BADGES.map((badge) => (
                    <div key={badge.id} className={`min-w-[80px] flex flex-col items-center p-3 rounded-2xl border-2 transition-all hover:scale-105 ${badge.unlocked ? 'border-yellow-100 bg-yellow-50/50' : 'border-gray-100 bg-gray-50 opacity-50 grayscale'}`}>
                       <div className="text-2xl mb-2 drop-shadow-sm">{badge.icon}</div>
                       <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{badge.name}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Activity History */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="flex border-b border-gray-100">
                  {['all', 'mission', 'complaint'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-4 text-sm font-bold capitalize transition-colors cursor-pointer ${
                        activeTab === tab 
                          ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab === 'all' ? 'All Activity' : tab + 's'}
                    </button>
                  ))}
               </div>

               <div className="p-2">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeTab}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="space-y-1"
                    >
                       {HISTORY.length === 0 ? (
                         <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                            <AlertCircle size={24} className="opacity-50" />
                            <p>No activity found yet. Start reporting issues or joining missions!</p>
                         </div>
                       ) : (
                         HISTORY.filter(h => activeTab === 'all' || h.type === activeTab).map((item) => (
                           <div key={item.id} className="p-4 hover:bg-gray-50 rounded-2xl flex items-center justify-between transition-colors group cursor-pointer">
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'mission' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                     {item.type === 'mission' ? <Target size={18} /> : <AlertTriangle size={18} />}
                                  </div>
                                  
                                  <div>
                                     <h4 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                                       {item.title}
                                     </h4>
                                     <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="capitalize font-medium">{item.type}</span>
                                        <span>•</span>
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                     </div>
                                  </div>
                              </div>
                              
                              <div className="text-right shrink-0 ml-2">
                                  <div className={`text-[10px] font-bold px-2 py-1 rounded-full inline-block mb-1 uppercase tracking-wide ${
                                    ['completed', 'resolved'].includes(item.status.toLowerCase()) ? 'bg-green-100 text-green-700' : 
                                    item.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                     {item.status}
                                  </div>
                                  {item.points > 0 && <div className="text-[10px] font-bold text-teal-600">+{item.points} XP</div>}
                              </div>
                           </div>
                         ))
                       )}
                    </motion.div>
                  </AnimatePresence>
               </div>
               
               <div className="p-4 border-t border-gray-100 text-center">
                  <button className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 cursor-pointer transition-colors w-full py-2 hover:bg-teal-50 rounded-xl">
                      View Full History <ChevronRight size={16} />
                  </button>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* RENDER EDIT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <EditProfileModal 
            user={USER} 
            onClose={() => setIsEditOpen(false)} 
            onUpdate={handleLocalUpdate}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfilePage;