import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Target, AlertTriangle, User, 
  LogOut, ChevronDown, ShieldCheck
} from 'lucide-react';

import api from '../../api/axios'; 
import NotificationBell from '../../components/Shared/NotificationBell';
import navbarIcon from '../../assets/main-icon.png'; 

const NavbarUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- STATE WITH SAFE DEFAULTS (Prevents Initial Crash) ---
  const [userData, setUserData] = useState({
    name: "User",
    role: "Citizen",
    avatar: "",
    level: 1,           
    currentLevelName: "Civic Scout", 
    points: 0,          
    nextLevelXP: 200    
  });

  // --- 1. FETCH USER DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        if (data) {
          setUserData({
            name: data.name || "User",
            role: data.role || "Citizen", // Fallback prevents crash
            avatar: data.avatar || "",
            level: data.level || 1,
            currentLevelName: data.currentLevel || "Civic Scout",
            points: data.totalPoints || 0,
            nextLevelXP: data.nextLevelXP || 200
          });
          // Update local cache for App.jsx to see
          localStorage.setItem('userInfo', JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to load navbar user data", error);
      }
    };
    
    fetchUserData();
  }, [location.pathname]); 

  // --- SECURE LOGOUT ---
  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("userInfo"); 
      window.location.href = "/"; 
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  // --- CRASH PREVENTION: SAFE DERIVED VALUES ---
  // The ?. check and || fallback ensures .replace() never runs on null
  const displayRole = (userData.role || "Citizen").replace('_', ' ');
  
  const displayAvatar = userData.avatar 
    ? userData.avatar 
    : `https://ui-avatars.com/api/?name=${userData.name}&background=0d9488&color=fff&size=128`;
  
  // Prevent division by zero crash
  const safeNextXP = userData.nextLevelXP || 200;
  const progressPercent = Math.min((userData.points / safeNextXP) * 100, 100);

  return (
    <nav className="sticky top-0 w-full bg-white/90 backdrop-blur-md font-sans z-50 border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. LOGO */}
          <div className="flex items-center shrink-0">
             <Link to="/" className="cursor-pointer">
                <img 
                  src={navbarIcon} 
                  alt="Lokarya Logo" 
                  className="h-12 md:h-14 w-auto object-contain hover:scale-105 transition-transform duration-200" 
                />
             </Link>
          </div>

          {/* 3. RIGHT SIDE: NOTIFICATIONS & PROFILE */}
          <div className="flex items-center gap-2 md:gap-4">
            
            <NotificationBell />

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="flex items-center gap-2 focus:outline-none group pl-2"
              >
                {/* Avatar with Level Badge */}
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                       <img 
                         src={displayAvatar} 
                         alt="User" 
                         className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                       />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[8px] font-black text-slate-900 w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                       {userData.level}
                    </div>
                </div>
                
                <div className="hidden md:block text-left ml-1">
                   <p className="text-xs font-bold text-gray-900 group-hover:text-teal-600 transition-colors truncate max-w-[120px]">
                     {userData.name}
                   </p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                     {displayRole}
                   </p>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-teal-600 transition-colors hidden md:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    
                    {/* --- DYNAMIC STATS CARD --- */}
                    <div className="bg-slate-900 p-4 text-white relative">
                        {/* Subtle background decoration */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500 rounded-full blur-[40px] opacity-20"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                               <div>
                                  <p className="text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-1">Rank</p>
                                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                                     <ShieldCheck size={14} className="text-teal-400" />
                                     {userData.currentLevelName}
                                  </h4>
                               </div>
                               <div className="text-right">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Karma</p>
                                  <p className="text-sm font-black text-yellow-400">{userData.points} XP</p>
                               </div>
                            </div>
                            
                            {/* Modern Progress Bar */}
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${progressPercent}%` }}
                                 className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                               />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Level {userData.level}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Next: {userData.nextLevelXP} XP</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2 bg-white">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)} 
                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        <User size={18} className="text-slate-400" /> My Profile
                      </Link>
                      
                      <Link 
                        to="/activities" 
                        onClick={() => setIsProfileOpen(false)} 
                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        <Target size={18} className="text-slate-400" /> Missions
                      </Link>
                      
                      <Link 
                        to="/report-issue" 
                        onClick={() => setIsProfileOpen(false)} 
                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        <AlertTriangle size={18} className="text-slate-400" /> Complaints
                      </Link>

                      <Link 
                        to="/rewards" 
                        onClick={() => setIsProfileOpen(false)} 
                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        <Trophy size={18} className="text-yellow-500" /> Rewards Store
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <button 
                        onClick={handleLogout} 
                        className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default NavbarUser;