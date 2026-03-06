import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Users, CheckCircle, 
  ArrowRight, Trophy, Target, Flag, Hourglass, Zap,
  Compass, ShieldCheck, Flame, Medal, Crown, User, X
} from 'lucide-react';
import api from '../api/axios'; 
import { toast } from 'react-toastify';

// --- HELPER COMPONENTS ---
const getRankIcon = (rankName) => {
  switch (rankName) {
    case "Civic Scout": return <Compass className="text-emerald-300 animate-pulse" size={32} strokeWidth={2.5} />;
    case "Urban Guardian": return <ShieldCheck className="text-blue-300" size={32} strokeWidth={2.5} />;
    case "Impact Maker": return <Flame className="text-orange-400 fill-orange-400/20" size={32} strokeWidth={2.5} />;
    case "City Champion": return <Medal className="text-yellow-300" size={32} strokeWidth={2.5} />;
    case "Lokarya Legend": return <Crown className="text-yellow-500 fill-yellow-500/20" size={34} strokeWidth={2.5} />;
    default: return <User className="text-emerald-300" size={32} />;
  }
};

const SuccessModal = ({ isOpen, onClose, mission }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }} 
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden relative z-10 shadow-2xl text-center p-8"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-emerald-500 to-teal-600" />
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-emerald-600" size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Enlisted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            You joined <span className="font-bold text-teal-600">{mission?.title}</span>. <br/>Check your log for the briefing.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-dashed border-gray-300">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Potential Reward</div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="text-yellow-500 fill-yellow-500" size={20} />
              <span className="text-3xl font-black text-gray-800">+{mission?.pointsReward} XP</span>
            </div>
          </div>
          <button onClick={onClose} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
            Let's Do This!
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- MAIN PAGE ---
const ActivityPage = () => {
  const [activeTab, setActiveTab] = useState('board');
  const [missions, setMissions] = useState([]);
  const [myLog, setMyLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  const [userStats, setUserStats] = useState({
    currentRank: "Civic Scout",
    lifetimePoints: 0,
    nextLevelXP: 200,
    level: 1,
    userId: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile and Activities
      const [profileRes, activitiesRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/activities')
      ]);
      
      const userData = profileRes.data;
      const allActivities = activitiesRes.data;
      const currentUserId = userData._id;

      // Update User Stats
      setUserStats({
        currentRank: userData.currentLevel || "Civic Scout",
        lifetimePoints: userData.lifetimePoints || 0,
        nextLevelXP: userData.nextLevelXP || 200,
        level: userData.level || 1,
        userId: currentUserId
      });

      // Helper to safely extract participant ID
      const getParticipantId = (p) => typeof p.user === 'object' ? p.user._id : p.user;

      // 2. Filter available missions (where user hasn't joined yet)
      const availableMissions = allActivities.filter(act => 
        !act.participants.some(p => getParticipantId(p) === currentUserId)
      );
      setMissions(availableMissions);
      
      // 3. Filter 'My Log' missions (where user IS a participant)
      const enlistedMissions = allActivities.filter(act => 
        act.participants.some(p => getParticipantId(p) === currentUserId)
      ).map(act => {
        const myEntry = act.participants.find(p => getParticipantId(p) === currentUserId);
        return {
          ...act,
          myStatus: myEntry ? myEntry.status : 'pending'
        };
      });
      
      setMyLog(enlistedMissions);
    } catch (error) {
      console.error("Data fetch error", error);
      toast.error("Failed to load mission board");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- THE FIXED ENLISTMENT FUNCTION ---
  const handleAcceptMission = async (mission) => {
    const missionId = mission._id || mission.id;
    if (!missionId) {
       toast.error("Invalid mission ID");
       return;
    }

    setActionLoading(missionId);
    try {
      // FIX: Added {} as the payload so Axios correctly sends a POST request body
      await api.post(`/activities/${missionId}/claim`, {});
      
      setSelectedMission(mission);
      setShowSuccess(true);
      
      // Data will refresh automatically when the modal closes
    } catch (error) {
      console.error("Enlist Error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to accept mission. It might be full.");
    } finally {
      setActionLoading(null);
    }
  };

  const progressPercent = Math.min((userStats.lifetimePoints / userStats.nextLevelXP) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <SuccessModal 
        isOpen={showSuccess} 
        onClose={() => { 
          setShowSuccess(false); 
          fetchData(); // Refresh data to move mission to "My Log"
          setActiveTab('log'); // Switch tab automatically
        }} 
        mission={selectedMission} 
      />

      {/* --- HEADER --- */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 pb-20 pt-8 px-4 shadow-xl rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto flex justify-between items-center text-white relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-300 bg-teal-700 flex items-center justify-center text-2xl shadow-lg relative">
              {getRankIcon(userStats.currentRank)}
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[10px] font-bold text-black px-1.5 rounded-full border border-white">Lvl {userStats.level}</div>
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight">{userStats.currentRank}</h2>
              <div className="w-32 h-1.5 bg-teal-800/50 rounded-full mt-1 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-emerald-300" />
              </div>
              <p className="text-[10px] text-emerald-100 font-medium mt-0.5">{userStats.lifetimePoints} / {userStats.nextLevelXP} XP</p>
            </div>
          </div>
          <button onClick={() => window.location.href = '/rewards'} className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-colors shadow-lg">
            <Trophy size={16} className="text-yellow-300" /> Rewards
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white p-1.5 rounded-2xl shadow-lg flex mb-8 max-w-lg mx-auto">
          <button onClick={() => setActiveTab('board')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'board' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Target size={18} /> Mission Board</button>
          <button onClick={() => setActiveTab('log')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'log' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Flag size={18} /> My Log</button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'board' && (
            <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.map((mission) => (
                <div key={mission._id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full">
                  <div className="h-44 relative overflow-hidden">
                    <img src={mission.banner || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2"} alt={mission.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{mission.category}</div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                       <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-lg"><Zap size={16} fill="currentColor" /></div>
                       <span className="text-white font-bold text-lg shadow-black drop-shadow-md">+{mission.pointsReward} XP</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                     <div className="mb-1 text-[10px] font-bold text-teal-600 uppercase tracking-wide">Guild: {mission.ngo?.organizationName || mission.ngo?.name || "Global NGO"}</div>
                     <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{mission.title}</h3>
                     <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-500"><Calendar size={16} className="text-teal-500"/><span>{new Date(mission.date).toLocaleDateString()}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-500"><MapPin size={16} className="text-teal-500"/><span>{mission.location?.name || mission.location}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-500"><Users size={16} className="text-teal-500"/><span>{mission.maxParticipants - (mission.participants?.length || 0)} spots left</span></div>
                     </div>
                     <div className="mt-auto">
                        <button 
                          onClick={() => handleAcceptMission(mission)}
                          disabled={actionLoading === mission._id}
                          className="w-full bg-[#0f4c75] hover:bg-[#0b3a5b] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                        >
                          {actionLoading === mission._id ? "Enlisting..." : "Accept Mission"} <ArrowRight size={18} />
                        </button>
                     </div>
                  </div>
                </div>
              ))}
              {missions.length === 0 && !loading && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                   <p className="text-gray-400 font-medium">No new missions available right now.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'log' && (
            <motion.div key="log" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 max-w-4xl mx-auto">
               {myLog.map((item) => (
                 <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                    <div className="w-full md:w-28 h-28 rounded-xl overflow-hidden shrink-0 relative">
                       <img src={item.banner || item.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2"} alt={item.title} className="w-full h-full object-cover" />
                       {item.myStatus === 'approved' && (<div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle className="text-white drop-shadow-lg" size={32} /></div>)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">By {item.ngo?.organizationName || "Guild Partner"} • {new Date(item.date).toDateString()}</p>
                       <div className="flex justify-center md:justify-start">
                          {item.myStatus === 'approved' ? (
                             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1.5"><CheckCircle size={14} /> Mission Accomplished</span>
                          ) : item.myStatus === 'pending' ? (
                             <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse"><Hourglass size={14} /> Awaiting Verification</span>
                          ) : (
                             <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1.5"><X size={14} /> Mission Failed/Declined</span>
                          )}
                       </div>
                    </div>
                    <div className="text-center md:text-right min-w-[120px] bg-gray-50 p-3 rounded-xl border border-gray-100 w-full md:w-auto">
                       <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">XP Reward</div>
                       <div className={`text-2xl font-black ${item.myStatus === 'approved' ? 'text-green-600' : 'text-gray-300'}`}>+{item.pointsReward}</div>
                    </div>
                 </div>
               ))}
               {myLog.length === 0 && !loading && (
                 <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <Flag className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-400 font-bold">No active quests in your log.</p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityPage;