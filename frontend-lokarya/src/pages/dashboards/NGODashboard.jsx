import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Users, Calendar, MapPin, 
  Edit3, CheckCircle, ArrowRight, 
  Loader2, Target, Image as ImageIcon,
  ShieldAlert
} from 'lucide-react';
import api from '../../api/axios';

const NGODashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/ngo')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Dashboard</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* --- HEADER (Non-Sticky) --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-40 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Mission Control
            </h1>
            <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
              Manage your civic impact & volunteers
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/ngo/create')}
            className="hidden sm:flex bg-[#0f4c75] hover:bg-[#0b3a5b] text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest shadow-md transition-all active:scale-95 items-center gap-2"
          >
            <Plus size={18} /> New Mission
          </button>
          {/* Mobile button */}
          <button 
            onClick={() => navigate('/dashboard/ngo/create')}
            className="sm:hidden bg-[#0f4c75] text-white p-3 rounded-xl shadow-md active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- STATS DASHBOARD --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <Users size={24} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-1">{data?.stats?.totalVolunteers || 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Volunteers</div>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
              <ShieldAlert size={24} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-1">{data?.stats?.pendingVolunteers || 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Verifications</div>
          </div>

          <button 
            onClick={() => navigate('/dashboard/ngo/verify')}
            className="bg-[#0f4c75] p-8 rounded-3xl text-white shadow-xl hover:bg-[#0b3a5b] transition-all group flex flex-col justify-between text-left relative overflow-hidden"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 relative z-10">
              <CheckCircle size={24} />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-black mb-1">Verification Center</div>
              <div className="text-sm font-medium text-blue-100 flex items-center gap-2">
                Approve volunteers <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <Target className="absolute -bottom-6 -right-6 text-white/5 group-hover:scale-110 transition-transform duration-700" size={140} />
          </button>
        </div>

        {/* --- MISSIONS GRID --- */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-2">
            <Target className="text-blue-500" size={24} />
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Your Active Missions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.recentMissions?.map((mission) => (
              <div key={mission._id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                {/* Image Header */}
                <div className="relative h-48 bg-gray-50 overflow-hidden">
                  {mission.banner ? (
                    <img src={mission.banner} alt={mission.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                    {mission.category}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-gray-900 mb-4 line-clamp-1" title={mission.title}>
                    {mission.title}
                  </h3>
                  
                  <div className="space-y-2.5 mb-6 flex-1">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                      <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Calendar size={16} /></div>
                      {new Date(mission.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                      <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><MapPin size={16} /></div>
                      <span className="truncate">{mission.location?.name || 'Location pending'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-gray-50 flex gap-3">
                    <button 
                      onClick={() => navigate(`/dashboard/ngo/edit/${mission._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => navigate(`/activity/${mission._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      View <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {(!data?.recentMissions || data.recentMissions.length === 0) && (
              <div className="col-span-full py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                  <Target size={32} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">No Active Missions</h3>
                <p className="text-sm font-medium text-gray-500 mb-6">You haven't launched any civic campaigns yet.</p>
                <button 
                  onClick={() => navigate('/dashboard/ngo/create')}
                  className="bg-[#0f4c75] hover:bg-[#0b3a5b] text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Create Mission
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;