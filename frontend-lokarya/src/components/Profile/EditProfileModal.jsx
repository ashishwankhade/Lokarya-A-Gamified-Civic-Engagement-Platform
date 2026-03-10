/**
 * EditProfileModal.jsx
 * Edit profile modal — bottom sheet on mobile, centered card on desktop.
 * Path: src/pages/profile/EditProfileModal.jsx
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Save, Loader2 } from 'lucide-react';
import { NV, OR, FF, SF } from './profileTokens';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name:     user.name,
    location: user.location || '',
  });
  const [preview, setPreview] = useState(user.image);
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const data = new FormData();
    data.append('name',     formData.name);
    data.append('location', formData.location);
    if (file) data.append('avatar', file);
    try {
      const res = await api.put('/auth/profile', data,
        { headers: { 'Content-Type': undefined } });
      onUpdate(res.data);
      toast.success('Profile updated!');
      onClose();
    } catch {
      toast.error('Update failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:'100%', padding:'12px 14px',
    background:'#f8fafc', border:'1.5px solid #f0ebe3',
    borderRadius:12, fontFamily:FF, fontSize:14,
    fontWeight:600, color:NV,
    transition:'border 0.2s, box-shadow 0.2s',
  };

  return (
    <div className="pp-modal-wrap"
      style={{ position:'fixed', inset:0, zIndex:9999,
        display:'flex', alignItems:'center',
        justifyContent:'center', padding:20 }}>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'absolute', inset:0,
          background:'rgba(0,0,0,0.62)', backdropFilter:'blur(6px)' }}
        onClick={onClose}/>

      {/* Card */}
      <motion.div
        className="pp-modal-card"
        initial={{ opacity:0, scale:0.94, y:24 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.94, y:24 }}
        transition={{ type:'spring', stiffness:340, damping:30 }}>

        {/* Top accent */}
        <div style={{ height:4,
          background:`linear-gradient(to right,${NV},${OR})` }}/>

        {/* Drag handle (mobile cue) */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10 }}>
          <div style={{ width:36, height:4, borderRadius:999,
            background:'#e2e8f0' }}/>
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center',
          justifyContent:'space-between', padding:'14px 28px 8px' }}>
          <div>
            <h3 style={{ fontFamily:SF, fontWeight:900,
              fontSize:20, color:NV, lineHeight:1.2 }}>
              Edit Profile
            </h3>
            <p style={{ fontSize:11, color:'#94a3b8',
              fontWeight:600, marginTop:3 }}>
              Update your public details
            </p>
          </div>
          <button onClick={onClose}
            style={{ width:34, height:34, borderRadius:'50%',
              background:'#f8fafc', border:'1.5px solid #f0ebe3',
              display:'flex', alignItems:'center',
              justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <X size={14} style={{ color:'#64748b' }}/>
          </button>
        </div>

        {/* Body */}
        <div className="pp-modal-body">

          {/* Avatar */}
          <div style={{ display:'flex', flexDirection:'column',
            alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ position:'relative', width:96, height:96,
              cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.querySelector('.ov').style.opacity='1'}
              onMouseLeave={e => e.currentTarget.querySelector('.ov').style.opacity='0'}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%',
                overflow:'hidden', border:`3px solid ${OR}`,
                boxShadow:`0 0 0 4px ${OR}20` }}>
                <img src={preview} alt="Avatar"
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </div>
              <div className="ov"
                style={{ position:'absolute', inset:0, borderRadius:'50%',
                  background:'rgba(15,44,74,0.55)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity:0, transition:'opacity 0.2s' }}>
                <Camera size={22} style={{ color:'#fff' }}/>
              </div>
              <input type="file" accept="image/*"
                style={{ position:'absolute', inset:0,
                  opacity:0, cursor:'pointer', zIndex:2 }}
                onChange={handleFileChange}/>
            </div>
            <p style={{ fontSize:9, fontWeight:800, color:'#94a3b8',
              textTransform:'uppercase', letterSpacing:'0.1em',
              textAlign:'center', lineHeight:1.5 }}>
              Tap to change
            </p>
          </div>

          {/* Fields */}
          <div className="pp-modal-fields"
            style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:9, fontWeight:800, color:'#94a3b8',
                textTransform:'uppercase', letterSpacing:'0.12em',
                display:'block', marginBottom:8 }}>
                Full Name
              </label>
              <input type="text"
                value={formData.name}
                maxLength={50}
                onChange={e => setFormData({ ...formData, name:e.target.value })}
                className="pp-input"
                style={inputStyle}/>
            </div>
            <div>
              <label style={{ fontSize:9, fontWeight:800, color:'#94a3b8',
                textTransform:'uppercase', letterSpacing:'0.12em',
                display:'block', marginBottom:8 }}>
                Location
              </label>
              <input type="text"
                value={formData.location}
                maxLength={100}
                placeholder="e.g. Nagpur, India"
                onChange={e => setFormData({ ...formData, location:e.target.value })}
                className="pp-input"
                style={inputStyle}/>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width:'100%', padding:'13px', borderRadius:14,
                border:'none',
                background: loading ? '#f1f5f9' : OR,
                color: loading ? '#94a3b8' : '#fff',
                fontFamily:FF, fontWeight:900, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center',
                justifyContent:'center', gap:10,
                boxShadow: loading ? 'none' : `0 6px 20px ${OR}40`,
                transition:'all 0.2s' }}>
              {loading
                ? <><Loader2 size={16} style={{ animation:'pp-spin 1s linear infinite' }}/> Saving…</>
                : <><Save size={16}/> Save Changes</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
