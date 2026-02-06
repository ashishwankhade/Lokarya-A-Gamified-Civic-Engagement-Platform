import React from 'react';
import { FileText, Calendar, MapPin, ChevronRight } from 'lucide-react';

const ComplaintCard = ({ complaint, onClick }) => {
  // Status Color Logic
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Decorative Side Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(complaint.status).split(' ')[0].replace('bg-', 'bg-')}`}></div>

      <div className="flex items-start sm:items-center gap-4 pl-2">
        
        {/* Image / Icon */}
        <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
          {complaint.image ? (
            <img src={complaint.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Thumb" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <FileText size={24} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-slate-800 text-base sm:text-lg truncate pr-2 group-hover:text-teal-600 transition-colors">
              {complaint.title || "Untitled Complaint"}
            </h4>
            <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(complaint.status)}`}>
              {complaint.status?.replace('_', ' ') || 'Pending'}
            </span>
          </div>

          <p className="text-sm text-slate-500 line-clamp-1 mt-1">
            {complaint.description || "No details provided."}
          </p>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Calendar size={14} className="text-slate-400" />
                {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}
             </div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 truncate max-w-[150px]">
                <MapPin size={14} className="text-slate-400" />
                <span className="truncate">{complaint.location?.address || "No Location"}</span>
             </div>
             {/* Mobile Status Badge */}
             <span className={`sm:hidden inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(complaint.status)}`}>
                {complaint.status?.replace('_', ' ') || 'Pending'}
             </span>
          </div>
        </div>

        {/* Arrow (Desktop Only) */}
        <div className="hidden sm:flex text-slate-300 group-hover:text-teal-500 transition-colors">
           <ChevronRight size={24} />
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;