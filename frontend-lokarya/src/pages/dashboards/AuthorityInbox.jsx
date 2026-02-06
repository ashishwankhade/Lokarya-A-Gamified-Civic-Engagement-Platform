import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Search, Filter, RefreshCw } from 'lucide-react';
import api from '../../api/axios'; 
import PageHeader from '../../components/layout/PageHeader';
import ComplaintCard from './ComplaintCard';
import ComplaintDetailModal from './ComplaintDetailModal';

const AuthorityInbox = () => {
  const [complaints, setComplaints] = useState([]); 
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data Wrapper
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const compRes = await api.get('/complaints');
      setComplaints(Array.isArray(compRes.data) ? compRes.data : []);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load complaints.");
      setComplaints([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  // Filter Logic
  const filteredComplaints = complaints.filter(c => {
    const statusMatch = filter === 'all' ? true : (c.status || 'pending') === filter;
    const q = searchQuery.toLowerCase();
    const searchMatch = 
        (c.title || "").toLowerCase().includes(q) ||
        (c.location?.address || "").toLowerCase().includes(q) ||
        (c._id || "").toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  const handleUpdate = async (id, formData) => {
    try {
      // --- ROBUST FIX ---
      // explicitly setting Content-Type to undefined overrides any global
      // 'application/json' defaults in axios.js, allowing the browser
      // to automatically generate the correct boundary for the file.
      const res = await api.put(`/complaints/${id}/status`, formData, {
        headers: { "Content-Type": undefined }
      });
      
      // Safety check for response
      if (res.data && res.data._id) {
          toast.success("Updated successfully!");
          
          // Update the list immediately in the background
          setComplaints(prev => prev.map(c => c._id === id ? res.data : c));
          
          // Update the modal (popup) so the user sees the change instantly
          if (selectedComplaint && selectedComplaint._id === id) {
              setSelectedComplaint(res.data); 
          }
      } else {
          console.error("Invalid Response:", res);
          toast.error("Update failed: Invalid server response.");
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Update failed.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen bg-slate-50">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
         <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Authority Inbox</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and resolve reported civic issues.</p>
         </div>
         <button onClick={fetchComplaints} className="self-start md:self-auto p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-sm" title="Refresh Data">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
         </button>
      </div>

      {/* 2. Controls Section (Sticky on Mobile for better UX) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 sticky top-2 z-10 md:static">
         
         {/* Search Input - Full width on mobile */}
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search ID, Title, Area..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 outline-none transition placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>

         {/* Filter Dropdown - Full width on mobile */}
         <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border-none rounded-xl text-slate-700 font-bold focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            {/* Custom Arrow Icon */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
         </div>
      </div>

      {/* 3. List Grid */}
      <div className="grid grid-cols-1 gap-4 pb-20">
        {loading ? (
             <div className="py-20 text-center text-slate-400 animate-pulse">Loading data...</div>
        ) : filteredComplaints.length === 0 ? (
           <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <Search size={32} />
              </div>
              <p className="text-slate-500 font-medium">No complaints found.</p>
           </div>
        ) : (
           filteredComplaints.map((c) => (
             <ComplaintCard 
                key={c._id || Math.random()}
                complaint={c}
                onClick={() => setSelectedComplaint(c)}
             />
           ))
        )}
      </div>

      {/* Modal - Opens when a card is clicked */}
      {selectedComplaint && (
        <ComplaintDetailModal 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)} 
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default AuthorityInbox;