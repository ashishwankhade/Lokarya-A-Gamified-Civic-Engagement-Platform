import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, Camera, MapPin, Calendar, Users, 
  Zap, AlignLeft, Phone, ArrowLeft, 
  Loader2, Target, CheckSquare, Image as ImageIcon
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const CreateMission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    category: 'Environment',
    pointsReward: 500, 
    date: '', 
    deadline: '',
    maxParticipants: 20, 
    locationName: '', 
    requirements: '', 
    contactInfo: ''
  });

  // --- FETCH DATA FOR EDIT MODE ---
  useEffect(() => {
    if (isEditMode) {
      const fetchMission = async () => {
        try {
          const { data } = await api.get(`/activities/${id}`);
          const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            // Formats to YYYY-MM-DDThh:mm for local datetime input
            return date.toISOString().slice(0, 16); 
          };

          setFormData({
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'Environment',
            pointsReward: data.pointsReward || 500,
            date: formatDate(data.date),
            deadline: formatDate(data.deadline),
            maxParticipants: data.maxParticipants || 20,
            locationName: data.location?.name || '',
            requirements: data.requirements ? data.requirements.join(', ') : '',
            contactInfo: data.contactInfo || ''
          });
          setImagePreview(data.banner);
        } catch (err) {
          toast.error("Mission not found or deleted");
          navigate('/dashboard/ngo');
        } finally {
          setFetching(false);
        }
      };
      fetchMission();
    }
  }, [id, isEditMode, navigate]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Require image only for new creations
    if (!imagePreview && !isEditMode) {
      toast.error("Please upload a mission cover image");
      setLoading(false);
      return;
    }

    const data = new FormData();
    
    // 1. Append File
    if (imageFile) {
      data.append('image', imageFile);
    }
    
    // 2. Append standard text fields
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('pointsReward', formData.pointsReward);
    data.append('date', formData.date);
    data.append('deadline', formData.deadline);
    data.append('maxParticipants', formData.maxParticipants);
    data.append('contactInfo', formData.contactInfo);
    
    // 3. Robust JSON formatting (Prevents backend crashes)
    data.append('location', JSON.stringify({ name: formData.locationName }));
    
    // Prevents an empty input from creating an array like [""]
    const reqArray = formData.requirements 
      ? formData.requirements.split(',').map(r => r.trim()).filter(Boolean) 
      : [];
    data.append('requirements', JSON.stringify(reqArray));

    try {
      // EXPLICIT HEADER: Required for Multer to read the file & form data properly
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (isEditMode) {
        await api.put(`/activities/${id}`, data, config);
        toast.success("Mission updated successfully!");
      } else {
        await api.post('/activities', data, config);
        toast.success("New mission is now live!");
      }
      navigate('/dashboard/ngo');
    } catch (err) {
      // DEEP LOGGING: Check your browser's inspect element console!
      console.error("Submission Error Details:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to process mission");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Mission Data</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* --- HEADER (Non-Sticky) --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/ngo')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {isEditMode ? 'Edit Mission' : 'Create New Mission'}
              </h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                Setup your civic engagement campaign
              </p>
            </div>
          </div>
          <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Target size={14} /> NGO Hub
          </div>
        </div>
      </div>

      {/* --- MAIN FORM --- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* 1. COVER IMAGE */}
          <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100">
            <div className={`relative w-full h-64 sm:h-80 rounded-[1.5rem] overflow-hidden group transition-all ${imagePreview ? 'bg-gray-900' : 'bg-gray-50 border-2 border-dashed border-gray-200 hover:bg-gray-100'}`}>
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover opacity-90 group-hover:opacity-50 transition-opacity duration-300" alt="Cover" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <label className="cursor-pointer bg-white/90 backdrop-blur text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
                      <Camera size={18} /> Change Cover
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-4">
                    <ImageIcon size={28} />
                  </div>
                  <span className="text-sm font-bold text-gray-600">Upload Mission Cover Photo</span>
                  <span className="text-xs text-gray-400 mt-1">High resolution, landscape recommended</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* 2. CORE DETAILS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft className="text-blue-500" size={20} />
              <h2 className="text-lg font-black text-gray-800">Mission Briefing</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Title</label>
                <input 
                  required name="title" value={formData.title} onChange={handleInputChange} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
                  placeholder="e.g. Weekend Park Cleanup Drive" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Category</label>
                <select 
                  name="category" value={formData.category} onChange={handleInputChange} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                >
                  {['Environment', 'Education', 'Healthcare', 'Sanitation', 'Social', 'Animal Welfare', 'Disaster Relief'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Description</label>
              <textarea 
                required name="description" value={formData.description} onChange={handleInputChange} rows="4" 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none leading-relaxed" 
                placeholder="Detail what volunteers will be doing, why it matters, and what they should expect..." 
              />
            </div>
          </div>

          {/* 3. LOGISTICS & REWARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Where & When */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-rose-500" size={20} />
                <h2 className="text-lg font-black text-gray-800">Time & Place</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Location Name</label>
                  <input required name="locationName" value={formData.locationName} onChange={handleInputChange} className="w-full border-b-2 border-gray-100 py-3 focus:border-rose-500 outline-none font-bold text-gray-700 transition-colors" placeholder="e.g. Ambazari Lake South Gate" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Mission Date</label>
                  <input required type="datetime-local" name="date" value={formData.date} onChange={handleInputChange} className="w-full border-b-2 border-gray-100 py-3 focus:border-rose-500 outline-none font-bold text-gray-700 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Registration Deadline</label>
                  <input required type="datetime-local" name="deadline" value={formData.deadline} onChange={handleInputChange} className="w-full border-b-2 border-gray-100 py-3 focus:border-rose-500 outline-none font-bold text-gray-700 transition-colors" />
                </div>
              </div>
            </div>

            {/* Capacity & XP */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-amber-500" size={20} />
                <h2 className="text-lg font-black text-gray-800">Capacity & XP</h2>
              </div>

              <div className="flex gap-6">
                <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <label className="text-[10px] font-black uppercase text-amber-600 tracking-widest block mb-2">XP Reward</label>
                  <input required type="number" name="pointsReward" value={formData.pointsReward} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-3xl font-black text-amber-500 outline-none focus:ring-0" />
                </div>
                <div className="flex-1 bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-2">Max Spots</label>
                  <input required type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-3xl font-black text-indigo-500 outline-none focus:ring-0" />
                </div>
              </div>

              <div className="mt-auto space-y-4">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 flex items-center gap-1"><CheckSquare size={12}/> Requirements</label>
                    <input name="requirements" value={formData.requirements} onChange={handleInputChange} className="w-full border-b-2 border-gray-100 py-3 focus:border-indigo-500 outline-none font-bold text-gray-700 transition-colors text-sm" placeholder="e.g. 18+ years, Wear boots (comma separated)" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 flex items-center gap-1"><Phone size={12}/> Contact Info</label>
                    <input required name="contactInfo" value={formData.contactInfo} onChange={handleInputChange} className="w-full border-b-2 border-gray-100 py-3 focus:border-indigo-500 outline-none font-bold text-gray-700 transition-colors text-sm" placeholder="e.g. Point of Contact Number or Email" />
                 </div>
              </div>
            </div>

          </div>

          {/* --- SUBMIT BAR (Non-Sticky) --- */}
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between mt-12 relative z-40">
            <p className="text-xs font-bold text-gray-400 px-4 text-center sm:text-left">
              Double check your dates before deploying.
            </p>
            <div className="flex w-full sm:w-auto gap-3">
              <button 
                type="button" onClick={() => navigate('/dashboard/ngo')} 
                className="flex-1 sm:flex-none px-6 py-4 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={loading} 
                className="flex-[2] sm:flex-none bg-[#0f4c75] hover:bg-[#0b3a5b] text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {isEditMode ? 'Save Mission' : 'Publish Mission'}</>}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateMission;