// src/dashboards/authority/ComplaintQueue.jsx — light theme
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, Flame, Clock, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const FILTERS = [
  { id:'all',              label:'All' },
  { id:'pending',          label:'Pending' },
  { id:'officer_assigned', label:'Officer Assigned' },
  { id:'worker_assigned',  label:'Worker Assigned' },
  { id:'in_progress',      label:'In Progress' },
  { id:'resolved',         label:'Resolved' },
  { id:'escalated',        label:'Escalated' },
];

// ✅ FIX: added worker_accepted — was missing, caused undefined style lookups
const STATUS_META = {
  pending:          { color:'#d97706', bg:'#fef3c7', border:'#fde68a' },
  under_review:     { color:'#7c3aed', bg:'#ede9fe', border:'#ddd6fe' },
  officer_assigned: { color:'#0369a1', bg:'#e0f2fe', border:'#bae6fd' },
  worker_assigned:  { color:'#7c3aed', bg:'#ede9fe', border:'#ddd6fe' },
  worker_accepted:  { color:'#0284c7', bg:'#e0f2fe', border:'#bae6fd' }, // ✅ added
  in_progress:      { color:'#2563eb', bg:'#dbeafe', border:'#bfdbfe' },
  resolved:         { color:'#059669', bg:'#d1fae5', border:'#a7f3d0' },
  closed:           { color:'#64748b', bg:'#f1f5f9', border:'#e2e8f0' },
  escalated:        { color:'#dc2626', bg:'#fee2e2', border:'#fecaca' },
  rejected:         { color:'#dc2626', bg:'#fee2e2', border:'#fecaca' },
};

const CAT_ICON = { Garbage:'🗑️', Roads:'🚧', Water:'💧', Electricity:'⚡', Traffic:'🚗', Other:'📋' };

// ✅ FIX: expanded SLA-active statuses to include worker_assigned and worker_accepted
// These are still pre-resolution and the SLA clock is still running
const SLA_ACTIVE_STATUSES = ['pending', 'under_review', 'officer_assigned', 'worker_assigned', 'worker_accepted'];

const SLATimer = ({ deadline, breached }) => {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setLabel('BREACHED'); return; }
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setLabel(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id);
  }, [deadline]);

  const bad = label === 'BREACHED' || breached;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
      padding:'3px 8px', borderRadius:6,
      background: bad ? '#fee2e2' : '#fef3c7',
      color:      bad ? '#dc2626' : '#d97706',
      border:     `1px solid ${bad ? '#fecaca' : '#fde68a'}` }}>
      {bad ? <Flame size={10}/> : <Clock size={10}/>} {label}
    </span>
  );
};

const ComplaintQueue = ({ onSelect }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent=false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const q = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await api.get(`/complaints${q}`);
      setComplaints(data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = complaints.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.ticketId?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) ||
           c.category?.toLowerCase().includes(q) || c.vibhag?.toLowerCase().includes(q);
  }).sort((a,b) => {
    if (a.slaBreached && !b.slaBreached) return -1;
    if (!a.slaBreached && b.slaBreached) return 1;
    return new Date(a.slaDeadline) - new Date(b.slaDeadline);
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif" }}>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ticket, category, vibhag…"
            style={{ width:'100%', paddingLeft:34, paddingRight:14, paddingTop:9, paddingBottom:9,
              borderRadius:10, background:'#fff', border:'1px solid #e2e8f0', color:'#0f172a',
              fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif",
              boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}/>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:10,
            background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
          <RefreshCw size={13} className={refreshing?'animate-spin':''}/> Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {FILTERS.map(f => {
          const count = f.id==='all' ? complaints.length : complaints.filter(c=>c.status===f.id).length;
          const on = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                background: on ? '#dbeafe' : '#fff',
                border:     on ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                color:      on ? '#1d4ed8' : '#64748b',
                fontFamily: "'DM Sans',sans-serif" }}>
              {f.label} <span style={{ opacity:0.55, marginLeft:3 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div className="hidden md:grid" style={{
          gridTemplateColumns:'2fr 1fr 1fr 1.2fr 1fr 28px',
          padding:'10px 20px', gap:16,
          background:'#f8fafc', borderBottom:'1px solid #f1f5f9',
          color:'#94a3b8', fontSize:10, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase',
        }}>
          <span>Complaint</span><span>Category</span><span>Status</span>
          <span>SLA Timer</span><span>Vibhag</span><span/>
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'60px 0', color:'#94a3b8' }}>
            <Loader2 size={18} className="animate-spin" style={{ color:'#2563eb' }}/> <span style={{ fontSize:13 }}>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'60px 0', textAlign:'center' }}>
            <CheckCircle2 size={30} style={{ color:'#e2e8f0', margin:'0 auto 10px' }}/>
            <p style={{ color:'#94a3b8', fontSize:13, fontWeight:700 }}>No complaints found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((c,i) => {
              const s = STATUS_META[c.status] || STATUS_META.pending;
              return (
                <motion.div key={c._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
                  onClick={() => onSelect(c._id)}
                  className="flex md:grid items-center gap-3 flex-wrap md:flex-nowrap"
                  style={{
                    gridTemplateColumns:'2fr 1fr 1fr 1.2fr 1fr 28px',
                    padding:'12px 20px', gap:16,
                    borderBottom:'1px solid #f8fafc',
                    cursor:'pointer', transition:'background 0.12s',
                    background: c.slaBreached ? '#fff7f7' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background=c.slaBreached?'#fff7f7':'transparent'}>

                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                      {c.slaBreached && <Flame size={11} style={{ color:'#dc2626', flexShrink:0 }}/>}
                      <p style={{ color:'#0f172a', fontWeight:700, fontSize:13 }} className="truncate">{c.title||`${c.category} Issue`}</p>
                    </div>
                    <p style={{ color:'#94a3b8', fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
                      {c.ticketId||`#${c._id?.slice(-6).toUpperCase()}`}
                    </p>
                  </div>

                  <span style={{ fontSize:13 }}>{CAT_ICON[c.category]||'📋'}{' '}
                    <span style={{ color:'#64748b', fontSize:12, fontWeight:600 }}>{c.category}</span>
                  </span>

                  <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`,
                    borderRadius:6, padding:'3px 9px', fontSize:10, fontWeight:800,
                    whiteSpace:'nowrap', width:'fit-content', textTransform:'capitalize' }}>
                    {c.status.replace(/_/g,' ')}
                  </span>

                  {/* ✅ FIX: SLA_ACTIVE_STATUSES now covers worker_assigned and worker_accepted */}
                  <div>
                    {SLA_ACTIVE_STATUSES.includes(c.status) && c.slaDeadline
                      ? <SLATimer deadline={c.slaDeadline} breached={c.slaBreached}/>
                      : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                  </div>

                  <span style={{ background:'#f1f5f9', color:'#64748b', borderRadius:6,
                    padding:'3px 9px', fontSize:12, fontWeight:600, whiteSpace:'nowrap', width:'fit-content' }}>
                    {c.vibhag||'—'}
                  </span>

                  <ChevronRight size={14} style={{ color:'#cbd5e1', flexShrink:0 }}/>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <p style={{ textAlign:'right', color:'#94a3b8', fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
        {filtered.length} result{filtered.length!==1?'s':''} · sorted by SLA urgency
      </p>
    </div>
  );
};

export default ComplaintQueue;