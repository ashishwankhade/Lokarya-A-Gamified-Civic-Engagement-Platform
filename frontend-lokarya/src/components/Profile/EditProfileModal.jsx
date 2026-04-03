/**
 * EditProfileModal.jsx
 * Edit profile modal — wired to PUT /api/auth/profile
 * Handles avatar upload (multipart/form-data), name, location, phone.
 * On success: calls onUpdate(updatedUser) so ProfileCard re-renders instantly.
 * Path: src/pages/profile/EditProfileModal.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { NV, OR, FF, SF } from './profileTokens';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// ─── Inline field-level feedback pill ────────────────────────────────────────
const FieldHint = ({ msg, type = 'error' }) => (
  <motion.p
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    style={{
      fontSize: 10, fontWeight: 700, marginTop: 5, marginLeft: 2,
      color: type === 'error' ? '#ef4444' : '#22c55e',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
    {type === 'error'
      ? <AlertCircle size={11} style={{ flexShrink: 0 }}/>
      : <CheckCircle2 size={11} style={{ flexShrink: 0 }}/>}
    {msg}
  </motion.p>
);

// ─── Validation helpers ───────────────────────────────────────────────────────
// Matches the same regex used in updateProfile controller:
//   /^\+?[0-9\s\-]{7,15}$/
const isPhoneValid = (phone) => {
  if (!phone) return true; // optional
  return /^\+?[0-9\s\-]{7,15}$/.test(phone.trim());
};

const isNameValid  = (name) => name.trim().length >= 2;

// ─── Component ────────────────────────────────────────────────────────────────
const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name:     user.name     || '',
    location: user.location || '',
    phone:    user.phone    || '',
  });
  const [preview, setPreview]   = useState(user.avatar || user.image || '');
  const [file,    setFile]      = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dirty,   setDirty]     = useState(false);   // track any change
  const [touched, setTouched]   = useState({});       // per-field blur tracking
  const prevData                = useRef(formData);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Track dirtiness
  useEffect(() => {
    const changed =
      formData.name     !== (user.name     || '') ||
      formData.location !== (user.location || '') ||
      formData.phone    !== (user.phone    || '') ||
      file !== null;
    setDirty(changed);
  }, [formData, file]);

  const handleBlur  = (field) => setTouched(t => ({ ...t, [field]: true }));
  const handleChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setDirty(true);
  };

  // ── Submit → PUT /api/auth/profile ──────────────────────────────────────────
  const handleSubmit = async () => {
    // Client-side guard (mirrors controller validation)
    if (!isNameValid(formData.name)) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!isPhoneValid(formData.phone)) {
      toast.error('Enter a valid phone number (e.g. +91 98765 43210)');
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('name',     formData.name.trim());
    data.append('location', formData.location.trim());
    // Send empty string to allow clearing phone on backend
    data.append('phone',    formData.phone.trim());
    if (file) data.append('avatar', file);

    try {
      // PUT /api/auth/profile  →  updateProfile controller
      // Controller returns: { _id, name, email, role, avatar, location, phone, xp }
      const res = await api.put('/auth/profile', data, {
        headers: { 'Content-Type': undefined }, // let axios set multipart boundary
      });

      const updated = res.data;

      // Normalise: controller sends `avatar`, ProfileCard may read `image`
      // Pass the full merged object so the parent can store it cleanly.
      onUpdate({
        ...user,          // preserve fields not returned (email, role, xp…)
        ...updated,
        image: updated.avatar || user.image || '',
      });

      toast.success('Profile updated! 🎉');

      // If profile_complete badge may have been triggered, show a nudge
      if (updated.avatar && updated.location && updated.phone && updated.name) {
        setTimeout(() => toast.info('🏅 You may have unlocked the Profile Complete badge!'), 1200);
      }

      onClose();
    } catch (err) {
      // Surface the server error message if available
      const msg = err?.response?.data?.message || 'Update failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Close guard: warn if unsaved changes ────────────────────────────────────
  const handleClose = () => {
    if (dirty && !loading) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    onClose();
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: '#f8fafc', border: '1.5px solid #f0ebe3',
    borderRadius: 12, fontFamily: FF, fontSize: 14,
    fontWeight: 600, color: NV, outline: 'none',
    transition: 'border 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const focusStyle = {
    border: `1.5px solid ${OR}`,
    boxShadow: `0 0 0 3px ${OR}18`,
  };

  return (
    <div
      className="pp-modal-wrap"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
      }}>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)',
        }}
        onClick={handleClose}/>

      {/* Card */}
      <motion.div
        className="pp-modal-card"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        style={{
          position: 'relative', zIndex: 1,
          background: '#fff', borderRadius: 24,
          width: '100%', maxWidth: 540,
          boxShadow: '0 24px 80px rgba(15,44,74,0.22)',
          overflow: 'hidden', fontFamily: FF,
        }}>

        {/* Top accent bar */}
        <div style={{ height: 4, background: `linear-gradient(to right,${NV},${OR})` }}/>

        {/* Drag handle (mobile cue) */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: '#e2e8f0' }}/>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 28px 8px',
        }}>
          <div>
            <h3 style={{ fontFamily: SF, fontWeight: 900, fontSize: 20, color: NV, lineHeight: 1.2 }}>
              Edit Profile
            </h3>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 3 }}>
              Update your public details
            </p>
          </div>
          <button onClick={handleClose}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#f8fafc', border: '1.5px solid #f0ebe3',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>
            <X size={14} style={{ color: '#64748b' }}/>
          </button>
        </div>

        {/* Body */}
        <div
          className="pp-modal-body"
          style={{
            display: 'flex', gap: 24, padding: '16px 28px 28px',
            flexWrap: 'wrap',
          }}>

          {/* ── Avatar upload ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <div
              style={{ position: 'relative', width: 96, height: 96, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.querySelector('.ov').style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.querySelector('.ov').style.opacity = '0'}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                overflow: 'hidden', border: `3px solid ${OR}`,
                boxShadow: `0 0 0 4px ${OR}20`,
              }}>
                {preview
                  ? <img src={preview} alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <div style={{
                      width: '100%', height: '100%',
                      background: NV, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>
                        {(formData.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                }
              </div>
              <div className="ov"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(15,44,74,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}>
                <Camera size={22} style={{ color: '#fff' }}/>
              </div>
              <input type="file" accept="image/*"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                onChange={handleFileChange}/>
            </div>
            <p style={{
              fontSize: 9, fontWeight: 800, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              textAlign: 'center', lineHeight: 1.5,
            }}>
              Tap to change
            </p>
            {file && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  fontSize: 9, color: '#22c55e', fontWeight: 800,
                  background: '#f0fdf4', padding: '2px 8px',
                  borderRadius: 999, border: '1px solid #bbf7d0',
                }}>
                ✓ New photo ready
              </motion.span>
            )}
          </div>

          {/* ── Fields ── */}
          <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name */}
            <div>
              <label style={{
                fontSize: 9, fontWeight: 800, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                display: 'block', marginBottom: 8,
              }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                maxLength={50}
                placeholder="Your full name"
                onChange={e => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlurCapture={e => Object.assign(e.target.style, { border: '1.5px solid #f0ebe3', boxShadow: 'none' })}
                className="pp-input"
                style={inputStyle}/>
              <AnimatePresence>
                {touched.name && !isNameValid(formData.name) &&
                  <FieldHint msg="Name must be at least 2 characters"/>}
              </AnimatePresence>
            </div>

            {/* Location */}
            <div>
              <label style={{
                fontSize: 9, fontWeight: 800, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                display: 'block', marginBottom: 8,
              }}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                maxLength={100}
                placeholder="e.g. Nagpur, India"
                onChange={e => handleChange('location', e.target.value)}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlurCapture={e => Object.assign(e.target.style, { border: '1.5px solid #f0ebe3', boxShadow: 'none' })}
                className="pp-input"
                style={inputStyle}/>
            </div>

            {/* Mobile Number */}
            <div>
              <label style={{
                fontSize: 9, fontWeight: 800, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                display: 'block', marginBottom: 8,
              }}>
                Mobile Number
                {!user.phone && (
                  <span style={{
                    marginLeft: 8, padding: '2px 7px',
                    background: `${OR}18`, color: OR,
                    borderRadius: 999, fontSize: 8,
                    fontWeight: 900, letterSpacing: '0.08em',
                    verticalAlign: 'middle',
                  }}>
                    REQUIRED FOR BADGE
                  </span>
                )}
              </label>

              {/* Flag + prefix wrapper */}
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  background: '#f8fafc', border: '1.5px solid #f0ebe3',
                  borderRadius: 12, overflow: 'hidden',
                  transition: 'border 0.2s, box-shadow 0.2s',
                }}
                onFocusCapture={e => {
                  e.currentTarget.style.border = `1.5px solid ${OR}`;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${OR}18`;
                }}
                onBlurCapture={e => {
                  e.currentTarget.style.border = '1.5px solid #f0ebe3';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 12px', borderRight: '1.5px solid #f0ebe3',
                  height: 46, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>🇮🇳</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#64748b', fontFamily: FF }}>+91</span>
                </div>
                <input
                  type="tel"
                  // Strip +91 prefix for display only — stored full in state
                  value={formData.phone.replace(/^\+91\s?/, '')}
                  maxLength={13}
                  placeholder="98765 43210"
                  onChange={e => {
                    const digits = e.target.value.replace(/[^\d\s]/g, '');
                    handleChange('phone', digits ? `+91${digits}` : '');
                  }}
                  onBlur={() => handleBlur('phone')}
                  style={{
                    flex: 1, padding: '12px 14px',
                    background: 'transparent', border: 'none', outline: 'none',
                    fontFamily: FF, fontSize: 14, fontWeight: 600, color: NV,
                  }}/>
                {formData.phone && (
                  <button
                    onClick={() => handleChange('phone', '')}
                    style={{
                      padding: '0 12px', background: 'none', border: 'none',
                      cursor: 'pointer', color: '#94a3b8',
                      display: 'flex', alignItems: 'center',
                    }}>
                    <X size={13}/>
                  </button>
                )}
              </div>

              <AnimatePresence>
                {touched.phone && formData.phone && !isPhoneValid(formData.phone) &&
                  <FieldHint msg="Enter a valid phone number (7–15 digits)"/>}
                {touched.phone && formData.phone && isPhoneValid(formData.phone) &&
                  <FieldHint msg="Looks good!" type="success"/>}
              </AnimatePresence>

              <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 5, marginLeft: 2 }}>
                Used for complaint SMS / WhatsApp updates only
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !dirty}
              style={{
                width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                background: loading || !dirty ? '#f1f5f9' : OR,
                color: loading || !dirty ? '#94a3b8' : '#fff',
                fontFamily: FF, fontWeight: 900, fontSize: 15,
                cursor: loading || !dirty ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                boxShadow: loading || !dirty ? 'none' : `0 6px 20px ${OR}40`,
                transition: 'all 0.2s',
              }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: 'pp-spin 1s linear infinite' }}/> Saving…</>
                : dirty
                  ? <><Save size={16}/> Save Changes</>
                  : <><CheckCircle2 size={16}/> No Changes</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
