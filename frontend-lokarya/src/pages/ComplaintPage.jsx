import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Camera, MapPin, CheckCircle, Clock, Zap, 
  Trophy, ChevronDown, ChevronUp, User, 
  ArrowRight, MoreHorizontal, Image as ImageIcon, Loader2, AlertCircle, Phone, 
  ShieldCheck, Compass, Flame, Medal, Crown 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios'; 

// --- STATIC CONFIG ---
const CATEGORIES = [
  { id: "Garbage", label: "Garbage", icon: "🗑️", color: "bg-red-50" },
  { id: "Roads", label: "Roads", icon: "🚧", color: "bg-orange-50" },
  { id: "Water", label: "Water", icon: "💧", color: "bg-blue-50" },
  { id: "Electricity", label: "Electric", icon: "⚡", color: "bg-yellow-50" },
  { id: "Traffic", label: "Traffic", icon: "🚗", color: "bg-purple-50" },
  { id: "Other", label: "Other", icon: <MoreHorizontal size={24} className="text-gray-600"/>, color: "bg-gray-100" },
];

// Updated Rank Icons to represent the progression names
const getRankIcon = (rankName) => {
  switch (rankName) {
    case "Civic Scout": 
      return <Compass className="text-emerald-300 animate-pulse" size={32} strokeWidth={2.5} />;
    case "Urban Guardian": 
      return <ShieldCheck className="text-blue-300" size={32} strokeWidth={2.5} />;
    case "Impact Maker": 
      return <Flame className="text-orange-400 fill-orange-400/20" size={32} strokeWidth={2.5} />;
    case "City Champion": 
      return <Medal className="text-yellow-300" size={32} strokeWidth={2.5} />;
    case "Lokarya Legend": 
      return <Crown className="text-yellow-500 fill-yellow-500/20" size={34} strokeWidth={2.5} />;
    default: 
      return <User className="text-emerald-300" size={32} />;
  }
};

const ComplaintPage = () => {
  const [activeTab, setActiveTab] = useState('new'); 
  const [expandedId, setExpandedId] = useState(null); 
  
  // --- NEW: GAMIFICATION STATE ---
  const [userStats, setUserStats] = useState({
    currentRank: "Civic Scout",
    lifetimePoints: 0,
    nextLevelXP: 200,
    level: 1
  });

  // Form State
  const [formData, setFormData] = useState({ category: '', desc: '', address: '', image: null });
  const [coords, setCoords] = useState(null); 
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Tracking State
  const [myComplaints, setMyComplaints] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // --- FETCH REAL USER DATA ---
  const fetchUserData = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setUserStats({
        currentRank: data.currentLevel || "Civic Scout",
        lifetimePoints: data.lifetimePoints || 0,
        nextLevelXP: data.nextLevelXP || 200,
        level: data.level || 1
      });
    } catch (error) {
      console.error("Failed to load user stats", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // --- 1. GEOLOCATION HANDLER ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success("Location detected!");
        setIsLocating(false);
      },
      (error) => {
        toast.error("Unable to retrieve location. Please allow access.");
        setIsLocating(false);
      }
    );
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if(file) {
      setFormData({...formData, image: file});
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- 2. SUBMIT COMPLAINT ---
  const handleSubmit = async () => {
    if (!formData.category || !formData.desc || !formData.address) {
      return toast.warning("Please fill in all fields.");
    }
    if (!coords) {
      return toast.warning("Please click the location pin to detect your coordinates.");
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('title', `${formData.category} Report`); 
      data.append('description', formData.desc);
      data.append('category', formData.category);
      
      data.append('location', JSON.stringify({
        address: formData.address,
        lat: Number(coords.lat),
        lng: Number(coords.lng)
      }));

      if (formData.image) {
        data.append('image', formData.image);
      }

      await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Complaint Submitted Successfully! +20 XP");
      
      // Seamlessly refresh stats in header
      fetchUserData();

      setFormData({ category: '', desc: '', address: '', image: null });
      setPreview(null);
      setCoords(null);
      setActiveTab('track'); 

    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. FETCH HISTORY ---
  useEffect(() => {
    if (activeTab === 'track') {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const { data } = await api.get('/complaints/my');
          setMyComplaints(data);
        } catch (error) {
          console.error(error);
          toast.error("Failed to load history");
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Calculate Progress % accurately based on floor and ceiling
  // Note: For Level 1, min is 0. Using simple ratio for cleaner visuals.
  const progressPercent = Math.min((userStats.lifetimePoints / userStats.nextLevelXP) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      
      {/* --- HEADER (DYNAMIC & PRESERVED DESIGN) --- */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 pb-20 pt-8 px-4 shadow-xl rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="max-w-4xl mx-auto flex justify-between items-center text-white relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-300 bg-teal-700 flex items-center justify-center shadow-lg relative">
              {getRankIcon(userStats.currentRank)}
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[10px] font-bold text-black px-1.5 rounded-full border border-white">
                  Lvl {userStats.level}
              </div>
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight">{userStats.currentRank}</h2>
              <div className="w-32 h-1.5 bg-teal-800/50 rounded-full mt-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPercent}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }} 
                    className="h-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.5)]" 
                  />
              </div>
              <p className="text-[10px] text-emerald-100 font-medium mt-0.5">
                {userStats.lifetimePoints} / {userStats.nextLevelXP} XP
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/rewards'}
            className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-colors shadow-lg cursor-pointer"
          >
            <Trophy size={16} className="text-yellow-300" /> Rewards
          </button>
        </div>
      </div>

      {/* --- MAIN BODY (Design preserved) --- */}
      <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white p-1.5 rounded-2xl shadow-lg flex mb-6">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'new' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Quick Report
          </button>
          <button 
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'track' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Track Status
          </button>
        </div>

        <LayoutGroup>
          <AnimatePresence mode="wait">
            {activeTab === 'new' && (
              <motion.div 
                key="new"
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8"
              >
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                  <Zap className="text-orange-500 fill-current" /> Raise a Complaint
                </h3>

                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">1. Select Issue Type</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFormData({...formData, category: cat.id})}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all border-2 h-20 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                          formData.category === cat.id 
                            ? 'border-teal-500 bg-teal-50 scale-105 shadow-md' 
                            : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-400 grayscale hover:grayscale-0'
                        }`}
                      >
                        <span className="text-2xl mb-1 flex items-center justify-center h-6 w-6">
                          {typeof cat.icon === 'string' ? cat.icon : cat.icon}
                        </span>
                        <span className="text-[10px] font-bold text-center leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">2. Location & Details</label>
                      <div className="relative">
                         <button 
                            onClick={handleGetLocation}
                            className={`absolute top-2 left-2 p-1.5 rounded-lg transition-colors z-10 ${coords ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-teal-500'}`}
                            title="Detect Location"
                         >
                            {isLocating ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                         </button>
                         <input 
                            type="text" 
                            placeholder={coords ? "Location Detected ✅" : "Click pin to detect location -> then type address"} 
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-100 font-medium mb-3 transition-shadow" 
                         />
                      </div>
                      <textarea 
                        value={formData.desc}
                        onChange={(e) => setFormData({...formData, desc: e.target.value})}
                        placeholder="Describe the issue shortly..."
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-100 font-medium resize-none transition-shadow"
                      ></textarea>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">3. Proof (Optional)</label>
                    <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer bg-teal-50 border-2 border-dashed border-teal-200 rounded-xl h-16 flex items-center justify-center gap-2 text-teal-700 hover:bg-teal-100 transition-colors">
                          <Camera size={20} />
                          <span className="text-sm font-bold">Add Photo</span>
                          <input type="file" className="hidden" onChange={handleImage} accept="image/*" />
                        </label>
                        {preview && (
                          <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
                             <img src={preview} alt="Evidence" className="h-full w-full object-cover" />
                             <button onClick={() => {setPreview(null); setFormData({...formData, image: null})}} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">×</button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-8 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <>Submit Complaint <ArrowRight size={20} /></>}
                </button>
              </motion.div>
            )}

            {activeTab === 'track' && (
              <motion.div 
                key="track"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-4"
              >
                {isLoadingHistory && <div className="text-center py-10 text-gray-500">Loading your complaints...</div>}
                
                {!isLoadingHistory && myComplaints.length === 0 && (
                  <div className="bg-white p-8 rounded-2xl text-center text-gray-400">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No complaints raised yet.</p>
                  </div>
                )}

                {myComplaints.map((item) => (
                  <motion.div 
                    layout 
                    key={item._id} 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <motion.div 
                      layout="position"
                      onClick={() => toggleExpand(item._id)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {item.status === 'resolved' ? <CheckCircle size={24} /> : <Zap size={24} fill="currentColor" />}
                          </div>
                          <div className="overflow-hidden">
                             <h4 className="font-bold text-gray-900 truncate">{item.category} Issue</h4>
                             <p className="text-xs text-gray-500 font-medium truncate">ID: {item._id.slice(-6).toUpperCase()}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                             item.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                             item.status === 'pending' ? 'bg-red-100 text-red-700' : 
                             'bg-blue-100 text-blue-700'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          {expandedId === item._id ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {expandedId === item._id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }} 
                          className="overflow-hidden bg-gray-50 border-t border-gray-100"
                        >
                          <div className="p-6">
                             {item.assignedOfficer && item.assignedOfficer.name ? (
                                <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 mb-8 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center border-2 border-teal-100 text-teal-600 shrink-0">
                                       <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-xs font-bold text-gray-400 uppercase">Assigned Officer</p>
                                       <h5 className="font-bold text-gray-900">{item.assignedOfficer.name}</h5>
                                       <p className="text-xs text-teal-600 font-medium capitalize">{item.assignedOfficer.designation || "Field Staff"}</p>
                                    </div>
                                    {item.assignedOfficer.contact && (
                                       <a href={`tel:${item.assignedOfficer.contact}`} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 cursor-pointer transition-colors">
                                          <Phone size={18} />
                                       </a>
                                    )}
                                </div>
                             ) : (
                                <div className="mb-8 p-4 bg-gray-100 rounded-xl text-center border border-dashed border-gray-300">
                                   <p className="text-sm text-gray-500">Waiting for officer assignment...</p>
                                </div>
                             )}

                             <div className="relative pl-2">
                                <div className="absolute top-2 left-[19px] h-[90%] w-0.5 bg-gray-200 rounded-full"></div>
                                <div className="space-y-8 relative z-10">
                                   {item.timeline?.map((step, idx) => (
                                      <div key={idx} className="relative flex gap-4">
                                          <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 shrink-0 shadow-lg ${step.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-teal-500 text-white'}`}>
                                            {step.status === 'resolved' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                          </div>
                                          <div>
                                            <h5 className="font-bold text-sm text-gray-900 capitalize">{step.status.replace('_', ' ')}</h5>
                                            <p className="text-xs text-gray-500 mt-0.5">{step.message}</p>
                                            <p className="text-[10px] font-bold mt-1 uppercase tracking-wide text-teal-600">
                                              {new Date(step.date).toLocaleDateString()} • {new Date(step.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                          </div>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             {item.status === 'resolved' && item.resolutionImage && (
                               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4">
                                 <h5 className="flex items-center gap-2 font-bold text-green-800 mb-3"><ImageIcon size={18} /> Resolution Proof</h5>
                                 <div className="relative rounded-lg overflow-hidden h-40 w-full shadow-sm">
                                   <img src={item.resolutionImage} alt="Resolution" className="w-full h-full object-cover" />
                                   <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">Verified by Officer</div>
                                 </div>
                                 <p className="text-xs text-green-700 mt-2 font-medium">Issue marked resolved. XP Added to your profile!</p>
                               </motion.div>
                             )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
};

export default ComplaintPage;