import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Zap, ArrowLeft, 
  ShieldCheck, Loader2, Clock, User 
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const VerifyVolunteers = () => {
  const navigate = useNavigate();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/activities/pending-approvals');
      
      if (Array.isArray(data)) {
        setPendingList(data);
      } else if (data && Array.isArray(data.pendingClaims)) {
        setPendingList(data.pendingClaims);
      } else {
        setPendingList([]); 
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending verifications");
      setPendingList([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPending(); 
  }, []);

  const handleVerify = async (activityId, userId, status, claimId) => {
    setProcessingId(claimId);
    try {
      const res = await api.put(`/activities/${activityId}/verify`, { userId, status });
      toast.success(res.data.message || (status === 'approved' ? "Volunteer Approved!" : "Request Declined"));
      setPendingList(prev => prev.filter(item => item._id !== claimId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#0f4c75] mb-4" size={40} />
      <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Requests...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* --- HEADER (Simplified, No Sticky) --- */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/ngo')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                Verification Center 
                {pendingList.length > 0 && (
                  <span className="bg-orange-100 text-orange-600 text-sm px-3 py-1 rounded-full font-bold">
                    {pendingList.length} New
                  </span>
                )}
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1 hidden sm:block">
                Review and approve volunteer attendance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {pendingList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 flex flex-col items-center justify-center text-center"
          >
            <ShieldCheck size={48} className="text-emerald-400 mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">You're all caught up!</h2>
            <p className="text-gray-500">No volunteers are waiting for verification right now.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {pendingList.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:shadow-md transition-shadow"
                >
                  
                  {/* Left Side: Info */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0 overflow-hidden">
                      {item.user?.avatar ? (
                        <img src={item.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        item.user?.name ? item.user.name[0].toUpperCase() : <User size={20} />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-gray-900 font-bold leading-tight">
                        {item.user?.name || "Unknown"} <span className="text-gray-500 font-medium">applied for</span> {item.activityTitle}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 text-gray-500 font-medium">
                          <Clock size={12} /> {new Date(item.joinedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Zap size={12} fill="currentColor" /> {item.points} XP Reward
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      disabled={processingId === item._id}
                      onClick={() => handleVerify(item.activityId, item.user?._id, 'rejected', item._id)}
                      className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50 active:scale-95"
                      title="Decline"
                    >
                      {processingId === item._id ? <Loader2 className="animate-spin" size={20} /> : <X size={20} strokeWidth={2.5} />}
                    </button>
                    
                    <button
                      disabled={processingId === item._id}
                      onClick={() => handleVerify(item.activityId, item.user?._id, 'approved', item._id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#0f4c75] text-white hover:bg-[#0b3a5b] rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      {processingId === item._id ? (
                         <Loader2 className="animate-spin" size={18} />
                      ) : (
                         <><Check size={18} strokeWidth={3} /> Approve</>
                      )}
                    </button>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyVolunteers;