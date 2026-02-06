import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Users, Clock, CheckCircle, 
  Award, ArrowRight, Trophy, Target, Flag, Hourglass, Zap,
  Compass, ShieldCheck, Flame, Medal, Crown, User
} from 'lucide-react';
import api from '../api/axios'; // Ensure this points to your axios instance
import { toast } from 'react-toastify';

// Helper to get Icon based on Rank Name (Matches Complaint Page)
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

const MISSIONS = [
  {
    id: 101,
    title: "City Clean-up Raid",
    ngo: "Green Earth Guild",
    difficulty: "Medium",
    date: "15 Jan, 08:00 AM",
    location: "Central Park",
    xp: 500,
    spots: 12,
    image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop",
    tags: ["Outdoor", "Teamwork"]
  },
  {
    id: 102,
    title: "The Green Canopy",
    ngo: "EcoWarriors Faction",
    difficulty: "Hard",
    date: "12 Jan, 09:00 AM",
    location: "Ambazari Forest",
    xp: 800,
    spots: 3,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop",
    tags: ["Nature", "Stamina"]
  },
  {
    id: 103,
    title: "Supply Run: Food",
    ngo: "Helping Hands",
    difficulty: "Easy",
    date: "20 Jan, 06:00 PM",
    location: "Railway Station",
    xp: 300,
    spots: 25,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop",
    tags: ["Charity", "Social"]
  }
];

const MY_LOG = [
  {
    id: 201,
    title: "Traffic Sentinel",
    ngo: "Road Safety Clan",
    date: "10 Jan",
    status: "Pending", 
    xp: 250,
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 202,
    title: "Blood Pact",
    ngo: "Red Cross",
    date: "01 Jan",
    status: "Completed",
    xp: 1000,
    image: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=600&auto=format&fit=crop"
  }
];

const ActivityPage = () => {
  const [activeTab, setActiveTab] = useState('board');
  const [userStats, setUserStats] = useState({
    currentRank: "Civic Scout",
    lifetimePoints: 0,
    nextLevelXP: 200,
    level: 1
  });

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

  const progressPercent = Math.min((userStats.lifetimePoints / userStats.nextLevelXP) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      
      {/* --- UPDATED HEADER (Dynamic Icons & Data) --- */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 pb-20 pt-8 px-4 shadow-xl rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="max-w-4xl mx-auto flex justify-between items-center text-white relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-300 bg-teal-700 flex items-center justify-center text-2xl shadow-lg relative">
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

      {/* --- MAIN CONTENT (Preserved Design) --- */}
      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-20">
        
        {/* Navigation Tabs */}
        <div className="bg-white p-1.5 rounded-2xl shadow-lg flex mb-8 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('board')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'board' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Target size={18} /> Mission Board
          </button>
          <button 
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'log' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Flag size={18} /> My Log
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'board' && (
            <motion.div 
              key="board"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {MISSIONS.map((mission) => (
                <div key={mission.id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  <div className="h-44 relative overflow-hidden">
                    <img src={mission.image} alt={mission.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{mission.difficulty}</div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                       <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-lg"><Zap size={16} fill="currentColor" /></div>
                       <span className="text-white font-bold text-lg shadow-black drop-shadow-md">+{mission.xp} XP</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                     <div className="mb-1 text-[10px] font-bold text-teal-600 uppercase tracking-wide">Guild: {mission.ngo}</div>
                     <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{mission.title}</h3>
                     <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-500"><Calendar size={16} className="text-teal-500"/><span>{mission.date}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-500"><MapPin size={16} className="text-teal-500"/><span>{mission.location}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-500"><Users size={16} className="text-teal-500"/><span>{mission.spots} spots left</span></div>
                     </div>
                     <div className="flex flex-wrap gap-2 mb-6">
                        {mission.tags.map(tag => (<span key={tag} className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-md">#{tag}</span>))}
                     </div>
                     <div className="mt-auto">
                        <button className="w-full bg-[#0f4c75] hover:bg-[#0b3a5b] text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95">Accept Mission <ArrowRight size={18} /></button>
                     </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'log' && (
            <motion.div key="log" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 max-w-4xl mx-auto">
               {MY_LOG.map((item) => (
                 <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                    <div className="w-full md:w-28 h-28 rounded-xl overflow-hidden shrink-0 relative group">
                       <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                       {item.status === 'Completed' && (<div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle className="text-white drop-shadow-lg" size={32} /></div>)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">By {item.ngo} • {item.date}</p>
                       <div className="flex justify-center md:justify-start">
                          {item.status === 'Completed' ? (
                             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1.5"><CheckCircle size={14} /> Mission Accomplished</span>
                          ) : (
                             <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse"><Hourglass size={14} /> Awaiting Verification</span>
                          )}
                       </div>
                    </div>
                    <div className="text-center md:text-right min-w-[120px] bg-gray-50 p-3 rounded-xl border border-gray-100 w-full md:w-auto">
                       <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">XP Reward</div>
                       <div className={`text-2xl font-black ${item.status === 'Completed' ? 'text-green-600' : 'text-gray-300'}`}>+{item.xp}</div>
                    </div>
                 </div>
               ))}
               {MY_LOG.length === 0 && (<div className="text-center py-16"><p className="text-gray-400 font-bold">No missions in your log yet.</p></div>)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityPage;