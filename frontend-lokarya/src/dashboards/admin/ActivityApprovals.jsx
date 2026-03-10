/**
 * ActivityApprovals.jsx
 * Path: src/dashboards/admin/ActivityApprovals.jsx
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, MapPin, CalendarDays,
  Users, Zap, Building2, Loader2, QrCode,
  Clock, Info,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

const NV = '#0f2c4a';
const V  = '#7c3aed';
const G  = '#059669';
const OR = '#F47C20';

const CAT_COLORS = {
  Environment:'#059669', Education:'#2563eb', Healthcare:'#dc2626',
  Social:'#7c3aed', 'Animal Welfare':'#d97706', Sanitation:'#0891b2', 'Disaster Relief':'#ea580c',
};

/* ── REVIEW MODAL ────────────────────────────────────────────────────────── */
const ReviewModal = ({ activity, onClose, onDone }) => {
  const [decision,  setDecision]  = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [busy,      setBusy]      = useState(false);
  const [qrUrl,     setQrUrl]     = useState(null);

  const submit = async () => {
    if (!decision) { toast.error('Select approve or reject'); return; }
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/activities/${activity._id}/review`, { decision, adminNote });
      if (data.qrDataUrl) setQrUrl(data.qrDataUrl);
      toast.success(decision === 'approved' ? 'Mission approved! QR generated.' : 'Mission rejected.');
      if (decision === 'rejected') { onDone(); onClose(); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally     { setBusy(false); }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)' }}
        onClick={() => { if (!busy) { onClose(); } }}/>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ position:'relative', zIndex:1, background:'#fff', borderRadius:24,
          padding:32, maxWidth: qrUrl ? 720 : 540, width:'100%',
          boxShadow:'0 32px 80px rgba(0,0,0,0.25)', fontFamily:"'DM Sans',sans-serif",
          maxHeight:'90vh', overflowY:'auto' }}>

        {/* QR SUCCESS VIEW */}
        {qrUrl ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#ecfdf5',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <CheckCircle2 size={32} style={{ color:G }}/>
            </div>
            <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:22, color:NV, marginBottom:8 }}>
              Mission Approved!
            </h3>
            <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>
              QR code generated and sent to the NGO dashboard.
            </p>
            <div style={{ background:'#f8fafc', borderRadius:16, padding:16, display:'inline-block', marginBottom:20 }}>
              <img src={qrUrl} alt="QR" style={{ width:220, height:220, display:'block', borderRadius:8 }}/>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => { const a=document.createElement('a'); a.href=qrUrl; a.download='mission-qr.png'; a.click(); }}
                style={{ flex:1, padding:'12px', borderRadius:12, border:'none', cursor:'pointer',
                  background:NV, color:'#fff', fontWeight:800, fontSize:14,
                  fontFamily:"'DM Sans',sans-serif" }}>
                Download QR PNG
              </button>
              <button onClick={() => { onDone(); onClose(); }}
                style={{ flex:1, padding:'12px', borderRadius:12, cursor:'pointer',
                  border:'2px solid #e2e8f0', background:'#fff', color:'#64748b',
                  fontWeight:800, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ACTIVITY PREVIEW */}
            <div style={{ marginBottom:24 }}>
              {activity.banner && (
                <div style={{ height:160, borderRadius:14, overflow:'hidden', marginBottom:16 }}>
                  <img src={activity.banner} alt={activity.title}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
              )}
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <span style={{ background:`${CAT_COLORS[activity.category] || '#64748b'}18`,
                    color: CAT_COLORS[activity.category] || '#64748b',
                    borderRadius:999, padding:'3px 10px', fontSize:11, fontWeight:800,
                    textTransform:'uppercase', marginBottom:8, display:'inline-block' }}>
                    {activity.category}
                  </span>
                  <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
                    fontSize:20, color:NV, lineHeight:1.3 }}>{activity.title}</h3>
                </div>
              </div>
              <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75, marginBottom:16 }}>
                {activity.description}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { I:Building2,   t: activity.ngo?.organizationName || activity.ngo?.name || 'Unknown NGO' },
                  { I:CalendarDays,t: new Date(activity.date).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' }) },
                  { I:MapPin,      t: activity.location?.name || 'Location TBD' },
                  { I:Users,       t: `Max ${activity.maxParticipants} volunteers` },
                  { I:Zap,         t: `+${activity.pointsReward} XP reward` },
                  { I:Clock,       t: `Deadline: ${new Date(activity.deadline).toLocaleDateString('en-IN')}` },
                ].map(({ I, t }, j) => (
                  <div key={j} style={{ display:'flex', alignItems:'center', gap:8,
                    background:'#f8fafc', borderRadius:10, padding:'8px 12px' }}>
                    <I size={14} style={{ color:'#94a3b8', flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:'#475569', fontWeight:600 }}>{t}</span>
                  </div>
                ))}
              </div>

              {/* GPS check */}
              {activity.location?.lat && activity.location?.lng ? (
                <div style={{ marginTop:12, background:'#ecfdf5', border:'1.5px solid #a7f3d0',
                  borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                  <CheckCircle2 size={14} style={{ color:G }}/>
                  <span style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>
                    GPS coordinates present ({activity.location.lat}, {activity.location.lng}) — QR will work
                  </span>
                </div>
              ) : (
                <div style={{ marginTop:12, background:'#fff0e0', border:'1.5px solid #fde8c8',
                  borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                  <Info size={14} style={{ color:OR }}/>
                  <span style={{ fontSize:12, fontWeight:700, color:'#92400e' }}>
                    ⚠ No GPS coords — QR generation may fail. Ask NGO to re-submit with coordinates.
                  </span>
                </div>
              )}
            </div>

            {/* DECISION */}
            <div style={{ borderTop:'2px solid #f0ebe3', paddingTop:20 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>
                Decision
              </div>
              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                {[
                  { v:'approved', label:'✅ Approve & Generate QR', bg:G,        fg:'#fff' },
                  { v:'rejected', label:'❌ Reject',                bg:'#dc2626', fg:'#fff' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setDecision(opt.v)}
                    style={{ flex:1, padding:'11px', borderRadius:12, cursor:'pointer',
                      border: decision===opt.v ? 'none' : '2px solid #e2e8f0',
                      background: decision===opt.v ? opt.bg : '#fff',
                      color:      decision===opt.v ? opt.fg : '#64748b',
                      fontWeight:800, fontSize:13, fontFamily:"'DM Sans',sans-serif",
                      transition:'all 0.15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:800, color:'#475569',
                  textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>
                  Admin Note (optional)
                </label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  rows={2} placeholder="e.g. Looks great! or Please re-submit with GPS coords."
                  style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:'2px solid #e2e8f0',
                    fontSize:13, fontFamily:"'DM Sans',sans-serif", color:NV, resize:'none', outline:'none' }}
                  onFocus={e => e.target.style.borderColor = V}
                  onBlur={e  => e.target.style.borderColor = '#e2e8f0'}/>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:14 }}>
                <button onClick={() => { onClose(); }}
                  style={{ flex:1, padding:'12px', borderRadius:12, border:'2px solid #e2e8f0',
                    background:'#fff', color:'#64748b', fontWeight:800, fontSize:14,
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Cancel
                </button>
                <button onClick={submit} disabled={!decision || busy}
                  style={{ flex:2, padding:'12px', borderRadius:12, border:'none',
                    background: !decision ? '#e2e8f0' : decision==='approved' ? G : '#dc2626',
                    color: !decision ? '#94a3b8' : '#fff', fontWeight:800, fontSize:14,
                    cursor: !decision ? 'not-allowed' : 'pointer',
                    fontFamily:"'DM Sans',sans-serif", opacity: busy ? 0.7 : 1,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {busy ? <Loader2 size={16} className="animate-spin"/> : null}
                  {busy ? 'Processing…' : 'Submit Decision'}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const ActivityApprovals = ({ onApproved }) => {
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reviewing,  setReviewing]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/activities/pending');
      setActivities(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load queue'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDone = () => { onApproved?.(); load(); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:"'DM Sans',sans-serif" }}>

      <AnimatePresence>
        {reviewing && (
          <ReviewModal
            activity={reviewing}
            onClose={() => setReviewing(null)}
            onDone={handleDone}
          />
        )}
      </AnimatePresence>

      <div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:24, color:NV }}>
          Approval Queue
        </h2>
        <p style={{ color:'#64748b', fontSize:14 }}>
          {activities.length} mission{activities.length !== 1 ? 's' : ''} awaiting review · Oldest first
        </p>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
          gap:10, padding:'60px 0', color:'#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" style={{ color:V }}/>
          <span style={{ fontWeight:700 }}>Loading queue…</span>
        </div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 24px', background:'#fff',
          borderRadius:20, border:'2px dashed #e2e8f0' }}>
          <CheckCircle2 size={48} style={{ color:'#a7f3d0', margin:'0 auto 16px' }}/>
          <p style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:20, color:NV, marginBottom:8 }}>
            All caught up!
          </p>
          <p style={{ color:'#94a3b8', fontSize:14 }}>No missions waiting for approval.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {activities.map((act, i) => {
            const catColor = CAT_COLORS[act.category] || '#64748b';
            const ngo      = act.ngo || {};
            return (
              <motion.div key={act._id}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background:'#fff', borderRadius:18, border:'2px solid #f0ebe3',
                  boxShadow:'0 2px 10px rgba(0,0,0,0.04)', overflow:'hidden',
                  display:'flex' }}>
                {/* left strip */}
                <div style={{ width:5, background:catColor, flexShrink:0 }}/>
                {/* banner thumbnail */}
                {act.banner && (
                  <div style={{ width:100, flexShrink:0 }}>
                    <img src={act.banner} alt={act.title}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  </div>
                )}
                {/* content */}
                <div style={{ flex:1, padding:'16px 20px', minWidth:0,
                  display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'flex-start',
                    justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <span style={{ background:`${catColor}18`, color:catColor,
                        borderRadius:999, fontSize:10, fontWeight:800,
                        padding:'3px 8px', textTransform:'uppercase',
                        letterSpacing:'0.05em', marginRight:8 }}>
                        {act.category}
                      </span>
                      <span style={{ background:'#fef3c7', color:'#92400e',
                        borderRadius:999, fontSize:10, fontWeight:800,
                        padding:'3px 8px', textTransform:'uppercase' }}>
                        ⏳ Pending
                      </span>
                      <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:700,
                        fontSize:16, color:NV, marginTop:6, lineHeight:1.3 }}>
                        {act.title}
                      </h3>
                    </div>
                    <button onClick={() => setReviewing(act)}
                      style={{ display:'flex', alignItems:'center', gap:6,
                        padding:'10px 18px', borderRadius:12, border:'none', cursor:'pointer',
                        background:V, color:'#fff', fontWeight:800, fontSize:13,
                        fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                      Review
                    </button>
                  </div>

                  <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                    {[
                      { I:Building2,    t: ngo.organizationName || ngo.name || 'Unknown' },
                      { I:CalendarDays, t: new Date(act.date).toLocaleDateString('en-IN') },
                      { I:MapPin,       t: act.location?.name || 'No location' },
                      { I:Users,        t: `${act.maxParticipants} max` },
                      { I:Zap,          t: `+${act.pointsReward} XP` },
                    ].map(({ I, t }, j) => (
                      <span key={j} style={{ display:'flex', alignItems:'center', gap:4,
                        fontSize:12, color:'#94a3b8' }}>
                        <I size={11} style={{ color:'#cbd5e1' }}/> {t}
                      </span>
                    ))}
                  </div>

                  {/* GPS warning */}
                  {(!act.location?.lat || !act.location?.lng) && (
                    <div style={{ display:'flex', alignItems:'center', gap:6,
                      background:'#fff0e0', borderRadius:8, padding:'6px 10px' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#92400e' }}>
                        ⚠ No GPS coordinates — QR will fail if approved without them.
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityApprovals;
