// src/pages/WorkerUploadPage.jsx
// Opened by field workers via WhatsApp magic link — no login required.
// Route: /worker/upload?token=<magicToken>
//
// Flow:
//   idle → accepting → accepted → previewing → uploading → success | error | expired
//
// Backend:
//   POST /api/complaints/:id/accept?token=xxx   ← NEW (step 5)
//   POST /api/complaints/magic-upload?token=xxx (field: "photo")  ← step 6

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, CheckCircle, XCircle, Loader2,
  Image as ImageIcon, RefreshCw, X, ClipboardCheck, ArrowRight,
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */
const getToken = () => new URLSearchParams(window.location.search).get('token');

/* ─── phases ────────────────────────────────────────────────────────────────
   idle        → worker landed, must tap "Accept Task"
   accepting   → POST /accept in-flight
   accepted    → accepted, now choose photo
   previewing  → photo chosen, confirm before upload
   uploading   → POST /magic-upload in-flight
   success     → upload done
   error       → upload failed (can retry)
   expired     → token missing / invalid / expired
   ─────────────────────────────────────────────────────────────────────────── */

export default function WorkerUploadPage() {
  const [phase,    setPhase]    = useState('idle');
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);

  /* validate token on mount */
  useEffect(() => {
    if (!getToken()) setPhase('expired');
  }, []);

  /* ── step 5: accept task ── */
  const acceptTask = async () => {
    setPhase('accepting');
    try {
      await axios.post(`${API}/complaints/accept?token=${getToken()}`);
      setPhase('accepted');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400 && (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid'))) {
        setPhase('expired');
      } else {
        // If already accepted / in_progress, still let them proceed to upload
        if (err.response?.status === 400 && msg.toLowerCase().includes('cannot accept')) {
          setPhase('accepted');
        } else {
          setErrorMsg(msg || 'Could not accept task. Please try again.');
          setPhase('error');
        }
      }
    }
  };

  /* ── pick file ── */
  const pickFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase('previewing');
  };

  const handleFileInput = (e) => pickFile(e.target.files?.[0]);
  const handleDrop      = (e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); };
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setPhase('accepted');   // go back to photo pick, not all the way to idle
    setErrorMsg('');
  };

  /* ── step 6: upload proof ── */
  const submit = async () => {
    if (!file) return;
    setPhase('uploading');
    const form = new FormData();
    form.append('photo', file);
    try {
      await axios.post(`${API}/complaints/magic-upload?token=${getToken()}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhase('success');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400 && msg.toLowerCase().includes('expired')) {
        setPhase('expired');
      } else {
        setErrorMsg(msg || 'Upload failed. Please try again.');
        setPhase('error');
      }
    }
  };

  /* ── step indicator (top of card) ── */
  const steps = [
    { key: 'accept', label: 'Accept' },
    { key: 'photo',  label: 'Photo'  },
    { key: 'submit', label: 'Submit' },
  ];
  const stepIndex = {
    idle: 0, accepting: 0, accepted: 1,
    previewing: 1, uploading: 2, success: 3, error: 1, expired: -1,
  }[phase] ?? 0;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg,#0a1628 0%,#0e2340 55%,#091b30 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,1,700;9..144,0,900&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes ripple  { 0%{box-shadow:0 0 0 0 rgba(251,146,60,0.5)} 70%{box-shadow:0 0 0 20px rgba(251,146,60,0)} 100%{box-shadow:0 0 0 0 rgba(251,146,60,0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0)} 50%{box-shadow:0 0 24px 4px rgba(251,146,60,0.25)} }
      `}</style>

      {/* background orbs */}
      <div style={{ position:'absolute', top:-120, right:-80, width:400, height:400,
        borderRadius:'50%', background:'radial-gradient(circle,rgba(251,146,60,0.10) 0%,transparent 70%)',
        pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-60, width:300, height:300,
        borderRadius:'50%', background:'radial-gradient(circle,rgba(20,184,166,0.08) 0%,transparent 70%)',
        pointerEvents:'none' }}/>

      {/* ── card ── */}
      <motion.div
        initial={{ opacity:0, y:28, scale:0.97 }}
        animate={{ opacity:1, y:0,  scale:1 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>

        {/* card header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {/* Lokarya wordmark */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,#fb923c,#f97316)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 14px rgba(251,146,60,0.4)' }}>
              <span style={{ fontSize:16 }}>🏙️</span>
            </div>
            <span style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
              fontSize:18, color:'#fff', letterSpacing:'-0.02em' }}>Lokarya</span>
          </div>

          <h1 style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
            fontSize:22, color:'#fff', lineHeight:1.2, marginBottom:6 }}>
            Field Worker<br/>
            <span style={{ color:'#fb923c', fontStyle:'italic' }}>Task Portal</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, lineHeight:1.6 }}>
            Accept your task, then upload a clear resolution photo.
          </p>

          {/* ── step indicator ── */}
          {phase !== 'expired' && (
            <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:18 }}>
              {steps.map((s, i) => {
                const done    = i < stepIndex;
                const active  = i === stepIndex && phase !== 'success';
                const success = phase === 'success';
                return (
                  <React.Fragment key={s.key}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius:'50%',
                        background: done || success
                          ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                          : active
                            ? 'linear-gradient(135deg,#fb923c,#f97316)'
                            : 'rgba(255,255,255,0.08)',
                        border: active ? '2px solid rgba(251,146,60,0.5)' : '2px solid transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all 0.35s',
                        boxShadow: active ? '0 0 12px rgba(251,146,60,0.4)' : 'none',
                      }}>
                        {done || success
                          ? <CheckCircle size={13} style={{ color:'#fff' }}/>
                          : <span style={{ fontSize:11, fontWeight:800,
                              color: active ? '#fff' : 'rgba(255,255,255,0.3)' }}>{i+1}</span>
                        }
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, marginTop:5,
                        color: active ? '#fb923c' : done || success ? '#22c55e' : 'rgba(255,255,255,0.25)',
                        transition:'color 0.35s' }}>
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{ flex:2, height:1.5, marginBottom:16,
                        background: i < stepIndex
                          ? 'linear-gradient(90deg,#22c55e,#22c55e)'
                          : 'rgba(255,255,255,0.1)',
                        transition:'background 0.35s' }}/>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* card body */}
        <div style={{ padding: '22px 24px 28px' }}>
          <AnimatePresence mode="wait">

            {/* ── IDLE: accept task ── */}
            {(phase === 'idle') && (
              <motion.div key="idle"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>

                {/* task info banner */}
                <div style={{
                  background:'rgba(251,146,60,0.08)',
                  border:'1px solid rgba(251,146,60,0.22)',
                  borderRadius:14, padding:'16px',
                  marginBottom:20,
                  display:'flex', alignItems:'flex-start', gap:12,
                }}>
                  <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                    background:'rgba(251,146,60,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ClipboardCheck size={18} style={{ color:'#fb923c' }}/>
                  </div>
                  <div>
                    <p style={{ color:'#fb923c', fontSize:13, fontWeight:800, marginBottom:3 }}>
                      New task assigned to you
                    </p>
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, lineHeight:1.6 }}>
                      Tap "Accept Task" to confirm you're on the way. You'll then upload a proof photo once the issue is resolved.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={acceptTask}
                  style={{
                    width: '100%', padding: '17px', borderRadius: 16, border: 'none',
                    background: 'linear-gradient(135deg,#fb923c,#f97316)',
                    color: '#fff', fontFamily:"'DM Sans',sans-serif",
                    fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 6px 24px rgba(251,146,60,0.45)',
                    animation: 'ripple 2.4s ease-in-out infinite',
                  }}>
                  <ClipboardCheck size={18} /> Accept Task
                  <ArrowRight size={16} style={{ marginLeft:2 }}/>
                </motion.button>
              </motion.div>
            )}

            {/* ── ACCEPTING: spinner ── */}
            {phase === 'accepting' && (
              <motion.div key="accepting"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ textAlign:'center', padding:'32px 0' }}>
                <div style={{ position:'relative', width:64, height:64, margin:'0 auto 18px' }}>
                  <div style={{ width:64, height:64, borderRadius:'50%',
                    border:'3px solid rgba(255,255,255,0.08)',
                    borderTop:'3px solid #fb923c',
                    animation:'spin 0.9s linear infinite' }}/>
                  <ClipboardCheck size={20} style={{ position:'absolute', inset:0,
                    margin:'auto', color:'#fb923c' }}/>
                </div>
                <p style={{ fontFamily:"'Fraunces',serif", fontWeight:700,
                  fontSize:17, color:'#fff', marginBottom:5 }}>Confirming…</p>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>
                  Notifying the citizen you're on the way
                </p>
              </motion.div>
            )}

            {/* ── ACCEPTED: choose photo ── */}
            {phase === 'accepted' && (
              <motion.div key="accepted"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>

                {/* confirmation pill */}
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  background:'rgba(34,197,94,0.12)',
                  border:'1px solid rgba(34,197,94,0.25)',
                  borderRadius:100, padding:'6px 14px',
                  marginBottom:18,
                }}>
                  <CheckCircle size={13} style={{ color:'#22c55e' }}/>
                  <span style={{ color:'#22c55e', fontSize:12, fontWeight:800 }}>
                    Task accepted — citizen notified
                  </span>
                </div>

                {/* Camera button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => cameraRef.current?.click()}
                  style={{
                    width: '100%', padding: '17px', borderRadius: 16, border: 'none',
                    background: 'linear-gradient(135deg,#fb923c,#f97316)',
                    color: '#fff', fontFamily:"'DM Sans',sans-serif",
                    fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 6px 24px rgba(251,146,60,0.45)',
                    animation: 'ripple 2.4s ease-in-out infinite',
                    marginBottom: 12,
                  }}>
                  <Camera size={19} /> Take Photo
                </motion.button>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                  style={{ display:'none' }} onChange={handleFileInput} />

                {/* gallery drag-drop */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#fb923c' : 'rgba(255,255,255,0.18)'}`,
                    borderRadius: 14, padding: '22px 16px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: dragOver ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.03)',
                  }}>
                  <ImageIcon size={28} style={{ color:'rgba(255,255,255,0.3)',
                    display:'block', margin:'0 auto 10px' }} />
                  <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:700 }}>
                    Or choose from gallery
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.25)', fontSize:11, marginTop:4 }}>
                    Tap to browse · JPG, PNG, HEIC
                  </p>
                </motion.div>
                <input ref={fileRef} type="file" accept="image/*"
                  style={{ display:'none' }} onChange={handleFileInput} />
              </motion.div>
            )}

            {/* ── PREVIEWING: confirm or retake ── */}
            {phase === 'previewing' && (
              <motion.div key="preview"
                initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0 }}>

                <div style={{ position:'relative', borderRadius:14, overflow:'hidden',
                  marginBottom:16, border:'2px solid rgba(255,255,255,0.12)' }}>
                  <img src={preview} alt="Preview"
                    style={{ width:'100%', height:220, objectFit:'cover', display:'block' }} />
                  <button onClick={reset}
                    style={{ position:'absolute', top:10, right:10,
                      width:32, height:32, borderRadius:'50%',
                      background:'rgba(0,0,0,0.55)', border:'none',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', color:'#fff' }}>
                    <X size={15} />
                  </button>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0,
                    background:'linear-gradient(to top,rgba(0,0,0,0.6),transparent)',
                    padding:'12px 14px 10px' }}>
                    <p style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:700 }}>
                      {file?.name}
                    </p>
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:10 }}>
                      {(file?.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <div style={{ background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
                  <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.65 }}>
                    ✅ Make sure the photo clearly shows the resolved issue before submitting.
                  </p>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={reset}
                    style={{ flex:1, padding:'12px', borderRadius:12, border:'none',
                      background:'rgba(255,255,255,0.08)',
                      color:'rgba(255,255,255,0.7)',
                      fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:800,
                      cursor:'pointer', display:'flex', alignItems:'center',
                      justifyContent:'center', gap:7 }}>
                    <RefreshCw size={14} /> Retake
                  </button>
                  <motion.button whileTap={{ scale:0.97 }} onClick={submit}
                    style={{ flex:2, padding:'12px', borderRadius:12, border:'none',
                      background:'linear-gradient(135deg,#22c55e,#16a34a)',
                      color:'#fff', fontFamily:"'DM Sans',sans-serif",
                      fontSize:13, fontWeight:800, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      boxShadow:'0 4px 16px rgba(34,197,94,0.35)' }}>
                    <Upload size={14} /> Submit Proof
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── UPLOADING ── */}
            {phase === 'uploading' && (
              <motion.div key="uploading"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ textAlign:'center', padding:'32px 0' }}>
                <div style={{ position:'relative', width:72, height:72, margin:'0 auto 20px' }}>
                  <div style={{ width:72, height:72, borderRadius:'50%',
                    border:'4px solid rgba(255,255,255,0.08)',
                    borderTop:'4px solid #fb923c',
                    animation:'spin 1s linear infinite' }}/>
                  <Upload size={22} style={{ position:'absolute', inset:0,
                    margin:'auto', color:'#fb923c' }}/>
                </div>
                <p style={{ fontFamily:"'Fraunces',serif", fontWeight:700,
                  fontSize:18, color:'#fff', marginBottom:6 }}>Uploading…</p>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>
                  Please don't close this page
                </p>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {phase === 'success' && (
              <motion.div key="success"
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                transition={{ type:'spring', stiffness:260, damping:22 }}
                style={{ textAlign:'center', padding:'32px 0' }}>
                <motion.div
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ delay:0.1, type:'spring', stiffness:300, damping:18 }}
                  style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px',
                    background:'linear-gradient(135deg,#22c55e,#16a34a)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 8px 28px rgba(34,197,94,0.45)' }}>
                  <CheckCircle size={34} style={{ color:'#fff' }}/>
                </motion.div>
                <p style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
                  fontSize:22, color:'#fff', marginBottom:8 }}>
                  Proof Submitted!
                </p>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13,
                  lineHeight:1.7, maxWidth:280, margin:'0 auto' }}>
                  The ward officer has been notified and will review your photo to close this complaint.
                </p>
                <div style={{ marginTop:24, padding:'12px 16px',
                  background:'rgba(34,197,94,0.1)',
                  border:'1px solid rgba(34,197,94,0.25)',
                  borderRadius:12 }}>
                  <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>
                    You can now close this tab. ✓
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── ERROR ── */}
            {phase === 'error' && (
              <motion.div key="error"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                  background:'rgba(239,68,68,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:'2px solid rgba(239,68,68,0.3)' }}>
                  <XCircle size={28} style={{ color:'#ef4444' }}/>
                </div>
                <p style={{ fontFamily:"'Fraunces',serif", fontWeight:700,
                  fontSize:18, color:'#fff', marginBottom:6 }}>Something went wrong</p>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13,
                  marginBottom:20, lineHeight:1.6, maxWidth:280, margin:'0 auto 20px' }}>
                  {errorMsg}
                </p>
                <button onClick={() => setPhase(file ? 'previewing' : 'idle')}
                  style={{ padding:'11px 24px', borderRadius:12, border:'none',
                    background:'rgba(255,255,255,0.1)',
                    color:'#fff', fontFamily:"'DM Sans',sans-serif",
                    fontSize:13, fontWeight:800, cursor:'pointer',
                    display:'inline-flex', alignItems:'center', gap:7 }}>
                  <RefreshCw size={14} /> Try Again
                </button>
              </motion.div>
            )}

            {/* ── EXPIRED / INVALID TOKEN ── */}
            {phase === 'expired' && (
              <motion.div key="expired"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
                  background:'rgba(251,146,60,0.12)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:'2px solid rgba(251,146,60,0.25)' }}>
                  <span style={{ fontSize:28 }}>⏱️</span>
                </div>
                <p style={{ fontFamily:"'Fraunces',serif", fontWeight:700,
                  fontSize:18, color:'#fff', marginBottom:6 }}>Link Expired</p>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13,
                  lineHeight:1.7, maxWidth:280, margin:'0 auto' }}>
                  This upload link has expired or already been used. Contact your ward officer to get a new link.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      {/* footer */}
      <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11,
        marginTop:20, textAlign:'center', fontWeight:600 }}>
        Lokarya Civic Platform · Nagpur
      </p>
    </div>
  );
}