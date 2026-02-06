import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import StatsCard from '../../components/layout/StatsCard';
import { 
  Users, ShieldAlert, CheckCircle, Activity, 
  ArrowRight, Clock, AlertTriangle 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Stats
        const statsRes = await api.get('/dashboard/super-admin');
        setData(statsRes.data);

        // 2. Fetch Recent Logs (We reuse the logs endpoint, limit to 5)
        // If you haven't built this exact filter yet, this might return all, 
        // so in production, add ?limit=5 to your backend query.
        const logsRes = await api.get('/admin/logs'); 
        setRecentLogs(logsRes.data.slice(0, 5)); 

      } catch (error) {
        console.error("Dashboard Load Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Command Center...</div>;

  // Calculate Resolution Rate
  const totalIssues = data?.system?.totalComplaints || 1;
  const resolvedIssues = data?.system?.resolvedComplaints || 0;
  const resolutionRate = Math.round((resolvedIssues / totalIssues) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Command Center" 
        subtitle="System-wide monitoring and governance."
      />

      {/* --- SECTION 1: HIGH-LEVEL METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={data?.users?.total || 0} 
          icon={Users} 
          color="blue" 
        />
        <StatsCard 
          title="Pending Reviews" 
          value={data?.users?.pendingApprovals || 0} 
          icon={ShieldAlert} 
          color="orange" 
        />
        <StatsCard 
          title="Total Issues" 
          value={data?.system?.totalComplaints || 0} 
          icon={AlertTriangle} 
          color="red" 
        />
        {/* New: Calculated Metric */}
        <StatsCard 
          title="Resolution Rate" 
          value={`${resolutionRate}%`} 
          icon={Activity} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- SECTION 2: IMMEDIATE ACTION (Pending Approvals) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <ShieldAlert size={20} className="text-orange-500" />
              Needs Attention
            </h3>
            <button 
              onClick={() => navigate('approvals')}
              className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {data?.users?.pendingApprovals === 0 ? (
            <div className="p-6 bg-green-50 rounded-lg text-center border border-green-100">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
              <p className="text-green-700 font-medium">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                <div>
                    <p className="text-orange-800 font-bold">
                      {data.users.pendingApprovals} accounts waiting
                    </p>
                    <p className="text-xs text-orange-600">New NGO/Authority signups</p>
                </div>
                <button 
                  onClick={() => navigate('approvals')}
                  className="px-3 py-1.5 bg-white text-orange-600 text-xs font-bold rounded border border-orange-200 shadow-sm hover:bg-orange-50"
                >
                  Review Now
                </button>
              </div>
              {/* You could map actual pending users here if you fetched them */}
            </div>
          )}
        </div>

        {/* --- SECTION 3: RECENT SYSTEM ACTIVITY --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              Recent Activity
            </h3>
            <span className="text-xs text-gray-400 uppercase font-bold">Live Feed</span>
          </div>

          <div className="space-y-4">
            {recentLogs.length === 0 ? (
               <p className="text-sm text-gray-400 italic">No system logs available yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{log.details || log.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono">
                        {log.actor?.name || "System"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;