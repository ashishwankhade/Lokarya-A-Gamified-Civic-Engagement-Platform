import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios'; 

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Derive unread count safely
  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !n.isRead).length 
    : 0;

  // 1. Fetch Notifications (Crash-Proof Version)
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      
      // FIX: Ensure data is actually an array before setting state
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        console.warn("Notifications data is not an array:", data);
        setNotifications([]); 
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      // Don't setNotifications([]) here if you want to keep old data on error, 
      // otherwise set it to [] to clear.
    }
  };

  // 2. Mark Single Notification as Read
  const markSingleAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // 3. Mark ALL as read
  const handleMarkAllRead = async (e) => {
    e.stopPropagation(); 
    if (unreadCount > 0) {
      try {
        await api.put('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (error) {
        console.error("Failed to mark all read", error);
      }
    }
  };

  // Polling for updates
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 focus:outline-none"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((note) => (
                  <div 
                    key={note._id} 
                    onClick={() => !note.isRead && markSingleAsRead(note._id)}
                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer ${!note.isRead ? 'bg-teal-50/30' : ''}`}
                  >
                    <div className="shrink-0 mt-1">
                      {getIcon(note.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm leading-snug ${!note.isRead ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                        {note.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        {new Date(note.createdAt).toLocaleDateString()} • {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    {!note.isRead && (
                       <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 shadow-sm shadow-teal-200"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;