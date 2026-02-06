import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  ClipboardList, CheckCircle, Clock, AlertTriangle, ArrowRight 
} from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import StatsCard from '../../components/layout/StatsCard';

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, in_progress: 0 });
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [chartData, setChartData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch All Complaints to generate analytics locally
        const { data: complaints } = await api.get('/complaints');

        if (Array.isArray(complaints)) {
            // 1. Calculate Stats
            const total = complaints.length;
            const pending = complaints.filter(c => c.status === 'pending').length;
            const resolved = complaints.filter(c => c.status === 'resolved').length;
            const in_progress = complaints.filter(c => c.status === 'in_progress').length;
            const rejected = complaints.filter(c => c.status === 'rejected').length;

            setStats({ total, pending, resolved, in_progress, rejected });

            // 2. Filter Urgent Issues (Pending only)
            const urgent = complaints
                .filter(c => c.status === 'pending')
                .slice(0, 5); // Show top 5
            setUrgentIssues(urgent);

            // 3. Generate Chart Data (Group by Category)
            const categoryMap = {};
            complaints.forEach(c => {
                const cat = c.category || "Uncategorized";
                categoryMap[cat] = (categoryMap[cat] || 0) + 1;
            });

            // Defined colors for common categories
            const colors = {
                'Garbage': '#f59e0b', // Orange
                'Roads': '#3b82f6',   // Blue
                'Water': '#06b6d4',   // Cyan
                'Electricity': '#ef4444', // Red
                'Civic': '#8b5cf6',   // Purple
                'Uncategorized': '#94a3b8' // Gray
            };

            const generatedChartData = Object.keys(categoryMap).map(key => ({
                name: key,
                count: categoryMap[key],
                color: colors[key] || '#6366f1' // Fallback color
            }));

            setChartData(generatedChartData);
        }

      } catch (error) {
        console.error("Dashboard Load Failed", error);
        setError("Failed to load live data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center text-slate-400 font-medium animate-pulse">Loading Analytics...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <PageHeader 
            title="City Operations" 
            subtitle="Monitor real-time civic issues and performance metrics."
          />
      </div>

      {/* SECTION 1: KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Reports" 
          value={stats.total} 
          icon={ClipboardList} 
          color="blue" 
        />
        <StatsCard 
          title="Pending Action" 
          value={stats.pending} 
          icon={AlertTriangle} 
          color="orange" 
        />
        <StatsCard 
          title="In Progress" 
          value={stats.in_progress} 
          icon={Clock} 
          color="purple" 
        />
        <StatsCard 
          title="Resolved" 
          value={stats.resolved} 
          icon={CheckCircle} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 2: CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-2">Complaint Breakdown</h3>
          <p className="text-slate-400 text-sm mb-6">Distribution of issues by category.</p>
          
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                        cursor={{ fill: '#f1f5f9' }} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={50}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
                    No data available for chart.
                </div>
            )}
          </div>
        </div>

        {/* SECTION 3: FEED (Top Urgent Issues) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[28rem]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              Recent Pending
            </h3>
            {/* Link to Inbox - Updated Path */}
            <button 
              onClick={() => navigate('/dashboard/authority/inbox')} 
              className="text-xs font-bold text-teal-600 hover:text-teal-700 transition"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin">
            {urgentIssues.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="mx-auto text-slate-200 mb-2" size={40} />
                <p className="text-slate-400 text-sm">All caught up! No pending issues.</p>
              </div>
            ) : (
              urgentIssues.map((issue) => (
                <div 
                    key={issue._id} 
                    // Clicking card goes to Inbox - Updated Path
                    onClick={() => navigate('/dashboard/authority/inbox')}
                    className="group p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {issue.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm mb-1 truncate group-hover:text-teal-600 transition">{issue.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{issue.description}</p>
                </div>
              ))
            )}
          </div>

          <button 
            // Button goes to Inbox - Updated Path
            onClick={() => navigate('/dashboard/authority/inbox')}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200"
          >
            Process Inbox <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthorityDashboard;