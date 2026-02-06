import React, { useState } from 'react';
import { 
  MapPin, CheckCircle, Clock, X, Camera, User, ExternalLink 
} from 'lucide-react';
import { toast } from 'react-toastify';

const ComplaintDetailModal = ({ complaint, onClose, onUpdate }) => {
  const [statusMsg, setStatusMsg] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [officerRole, setOfficerRole] = useState('');
  const [officerContact, setOfficerContact] = useState(''); 
  const [resolutionImage, setResolutionImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!complaint) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (newStatus) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('message', statusMsg);

      // --- 1. Handle Officer Assignment ---
      if (newStatus === 'in_progress') {
        if (!officerName.trim()) {
            setIsSubmitting(false);
            return toast.warning("Please enter the Officer's Name.");
        }
        formData.append('officerName', officerName);
        formData.append('officerRole', officerRole);
        formData.append('officerContact', officerContact); // Fixed: Uncommented this
      }

      // --- 2. Handle Resolution Proof ---
      if (newStatus === 'resolved') {
        if (!resolutionImage) {
            setIsSubmitting(false);
            return toast.warning("Resolution proof (image) is required.");
        }
        formData.append('image', resolutionImage);
      }

      // --- 3. Send to Parent ---
      await onUpdate(complaint._id, formData);
      onClose(); // Close modal on success
      
    } catch (error) {
      console.error("Modal Submit Error:", error);
      toast.error("Action failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMapLink = () => {
    const lat = complaint.location?.lat || complaint.lat;
    const lng = complaint.location?.lng || complaint.lng;
    return (lat && lng) ? `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}` : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl h-[95vh] sm:h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-up sm:animate-zoom-in">
        
        {/* --- LEFT PANEL: INFO --- */}
        <div className="w-full md:w-7/12 bg-slate-50 p-6 overflow-y-auto h-full scrollbar-thin">
           <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID: {complaint._id.slice(-6).toUpperCase()}</span>
                <h2 className="text-2xl font-black text-slate-800 mt-1 leading-tight">{complaint.title}</h2>
              </div>
              <button onClick={onClose} className="md:hidden p-2 bg-slate-200 rounded-full"><X size={20}/></button>
           </div>

           {/* Image Display */}
           <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white h-52 shrink-0">
              {complaint.image ? (
                <img src={complaint.image} alt="Issue" className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold bg-slate-100">No Image</div>
              )}
           </div>

           <div className="space-y-6 pb-24">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Details</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                     <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <MapPin size={16} className="text-teal-600"/> {complaint.location?.address}
                     </p>
                     {getMapLink() && (
                        <a href={getMapLink()} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline ml-6">
                          <ExternalLink size={12} /> View on Google Maps
                        </a>
                     )}
                  </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">History</h4>
                <div className="pl-4 border-l-2 border-slate-200 space-y-6 ml-2">
                   {complaint.timeline?.slice().reverse().map((log, i) => (
                      <div key={i} className="relative pl-6">
                         <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${i===0 ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                         <p className="text-xs font-bold text-slate-800 capitalize">{log.status.replace('_', ' ')}</p>
                         <p className="text-[10px] text-slate-500 mt-0.5">{log.message}</p>
                         <p className="text-[10px] text-slate-400 mt-1">{new Date(log.date).toLocaleString()}</p>
                      </div>
                   ))}
                </div>
              </div>
           </div>
        </div>

        {/* --- RIGHT PANEL: ACTIONS --- */}
        <div className="w-full md:w-5/12 bg-white flex flex-col border-l border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-none z-10">
           
           {/* Desktop Header */}
           <div className="hidden md:flex p-5 border-b border-slate-100 justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><User size={20} className="text-teal-600"/> Actions</h3>
              <button onClick={onClose} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition"><X size={20}/></button>
           </div>

           <div className="flex-1 p-5 flex flex-col justify-center overflow-y-auto">
              
              {/* STATE 1: PENDING */}
              {complaint.status === 'pending' && (
                <div className="space-y-4">
                   <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                      <Clock className="mx-auto text-amber-500 mb-2" size={28} />
                      <h4 className="font-bold text-amber-900 text-sm">Action Required</h4>
                      <p className="text-xs text-amber-700">Assign an officer or reject report.</p>
                   </div>
                   <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-teal-500" placeholder="Officer Name *" value={officerName} onChange={e=>setOfficerName(e.target.value)} />
                   
                   <div className="grid grid-cols-2 gap-3">
                      <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-teal-500" placeholder="Designation" value={officerRole} onChange={e=>setOfficerRole(e.target.value)} />
                      <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-teal-500" placeholder="Contact No." value={officerContact} onChange={e=>setOfficerContact(e.target.value)} />
                   </div>

                   <textarea className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-teal-500" placeholder="Instructions..." rows="2" value={statusMsg} onChange={e=>setStatusMsg(e.target.value)}></textarea>
                   
                   <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={()=>handleSubmit('rejected')} disabled={isSubmitting} className="py-3 bg-white border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50">Reject</button>
                      <button onClick={()=>handleSubmit('in_progress')} disabled={isSubmitting} className="py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-200">
                        {isSubmitting ? 'Saving...' : 'Assign'}
                      </button>
                   </div>
                </div>
              )}

              {/* STATE 2: IN PROGRESS */}
              {complaint.status === 'in_progress' && (
                <div className="space-y-4">
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm"><User size={20}/></div>
                      <div>
                         <h4 className="font-bold text-blue-900 text-sm">In Progress</h4>
                         <p className="text-xs text-blue-700">Officer: {complaint.assignedOfficer?.name || "Field Staff"}</p>
                      </div>
                   </div>
                   
                   {/* Upload Area */}
                   <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition group relative overflow-hidden">
                      {preview ? (
                        <>
                          <img src={preview} className="h-full object-contain z-10" alt="Preview"/>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                             <span className="text-white font-bold text-xs">Change Photo</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                           <Camera className="mx-auto text-slate-400 mb-1" />
                           <span className="text-xs font-bold text-slate-500">Click to Upload Proof *</span>
                        </div>
                      )}
                      <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                   </label>

                   <textarea className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500" placeholder="Resolution remarks..." rows="2" value={statusMsg} onChange={e=>setStatusMsg(e.target.value)}></textarea>

                   <button onClick={()=>handleSubmit('resolved')} disabled={isSubmitting} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                     {isSubmitting ? 'Uploading...' : <><CheckCircle size={18}/> Mark as Resolved</>}
                   </button>
                </div>
              )}

              {/* STATE 3: CLOSED/REJECTED */}
              {['resolved', 'rejected'].includes(complaint.status) && (
                <div className="text-center py-6 opacity-90">
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {complaint.status === 'resolved' ? <CheckCircle size={40} /> : <X size={40} />}
                   </div>
                   <h3 className="text-xl font-black text-slate-800 capitalize">{complaint.status}</h3>
                   <p className="text-xs text-slate-500 mb-4">This ticket is closed.</p>

                   {/* Proof Display */}
                   {complaint.status === 'resolved' && complaint.resolutionImage && (
                      <div className="mt-4 border border-slate-200 p-2 rounded-xl bg-slate-50 animate-in zoom-in">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-left tracking-wide">Proof of Resolution</p>
                          <img 
                            src={complaint.resolutionImage} 
                            alt="Resolution Proof" 
                            className="w-full h-40 object-cover rounded-lg shadow-sm" 
                          />
                      </div>
                   )}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;