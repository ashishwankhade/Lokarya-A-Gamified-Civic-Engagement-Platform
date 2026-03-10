// src/pages/WorkerUploadPage.jsx
// Opened by field workers via WhatsApp magic link — no login required.
// Route: /worker/upload?token=<magicToken>
// Backend: POST /api/complaints/magic-upload?token=xxx  (field: "photo")

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, CheckCircle, XCircle, Loader2, Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */
const token = () => new URLSearchParams(window.location.search).get('token');

/* ─── states the page can be in ────────────────────────────────────────────── */
// idle → previewing → uploading → success | error | expired

export default function WorkerUploadPage() {
  const [phase,      setPhase]      = useState('idle');     // see above
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const fileRef  = useRef(null);
  const cameraRef = useRef(null);

  /* validate token exists on mount */
  useEffect(() => {
    if (!token()) setPhase('expired');
  }, []);

  /* pick file from any input */
  const pickFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase('previewing');
  };

  const handleFileInput  = (e) => pickFile(e.target.files?.[0]);
  const handleDrop       = (e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); };
  const handleDragOver   = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave  = () => setDragOver(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setPhase('idle');
    setErrorMsg('');
  };

  const submit = async () => {
    if (!file) return;
    setPhase('uploading');
    const form = new FormData();
    form.append('photo', file);           // field name must match multer upload.single('photo')
    try {
      await axios.post(`${API}/complaints/magic-upload?token=${token()}`, form, {
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

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg,#0a1628 0%,#0e2340 55%,#091b30 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,1,700;9..144,0,900&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ripple {
          0%   { box-shadow: 0 0 0 0   rgba(251,146,60,0.5); }
          70%  { box-shadow: 0 0 0 20px rgba(251,146,60,0);  }
          100% { box-shadow: 0 0 0 0   rgba(251,146,60,0);   }
        }
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
            Upload Resolution<br/>
            <span style={{ color:'#fb923c', fontStyle:'italic' }}>Proof Photo</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, lineHeight:1.6 }}>
            Take or upload a clear photo showing the issue has been resolved.
          </p>
        </div>

        {/* card body */}
        <div style={{ padding: '22px 24px 28px' }}>
          <AnimatePresence mode="wait">

            {/* ── IDLE: choose photo ── */}
            {phase === 'idle' && (
              <motion.div key="idle"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

                {/* Camera button — opens native camera on mobile */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => cameraRef.current?.click()}
                  style={{
                    width: '100%', padding: '18px', borderRadius: 16, border: 'none',
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
                {/* hidden camera input */}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                  style={{ display:'none' }} onChange={handleFileInput} />

                {/* or pick from gallery */}
                <motion.div
                  whileTap={{ scale: 0.97 }}
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

                {/* preview image */}
                <div style={{ position:'relative', borderRadius:14, overflow:'hidden',
                  marginBottom:16, border:'2px solid rgba(255,255,255,0.12)' }}>
                  <img src={preview} alt="Preview"
                    style={{ width:'100%', height:220, objectFit:'cover', display:'block' }} />
                  {/* retake overlay button */}
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

                {/* confirm instructions */}
                <div style={{ background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
                  <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.65 }}>
                    ✅ Make sure the photo clearly shows the resolved issue before submitting.
                  </p>
                </div>

                {/* action buttons */}
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
                <div style={{ position:'relative', width:72, height:72,
                  margin:'0 auto 20px' }}>
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
                  fontSize:18, color:'#fff', marginBottom:6 }}>Upload Failed</p>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13,
                  marginBottom:20, lineHeight:1.6, maxWidth:280, margin:'0 auto 20px' }}>
                  {errorMsg}
                </p>
                <button onClick={() => setPhase('previewing')}
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

      {/* footer note */}
      <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11,
        marginTop:20, textAlign:'center', fontWeight:600 }}>
        Lokarya Civic Platform · Nagpur
      </p>
    </div>
  );
}
