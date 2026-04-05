// src/dashboards/authority/AuthorityOverview.jsx — light theme
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Flame, Zap, ChevronRight, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const CAT_ICON = { Garbage:'🗑️', Roads:'🚧', Water:'💧', Electricity:'⚡', Traffic:'🚗', Other:'📋' };

// ✅ FIX: added worker_accepted — was missing, caused undefined styles on recent complaint rows
const STATUS_META = {
  pending:          { color:'#d97706', bg:'#fef3c7', border:'#fde68a' },
  officer_assigned: { color:'#0369a1', bg:'#e0f2fe', border:'#bae6fd' },
  worker_assigned:  { color:'#7c3aed', bg:'#ede9fe', border:'#ddd6fe' },
  worker_accepted:  { color:'#0284c7', bg:'#e0f2fe', border:'#bae6fd' }, // ✅ added
  in_progress:      { color:'#2563eb', bg:'#dbeafe', border:'#bfdbfe' },
  resolved:         { color:'#059669', bg:'#d1fae5', border:'#a7f3d0' },
  closed:           { color:'#64748b', bg:'#f1f5f9', border:'#e2e8f0' },
  escalated:        { color:'#dc2626', bg:'#fee2e2', border:'#fecaca' },
};

const StatCard = ({ label, value, sub, color, bg, icon: Icon, delay, onClick }) => (
  <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.3 }}
    onClick={onClick}
    style={{
      borderRadius:14, padding:'18px 20px', background:'#ffffff',
      border:'1px solid #e2e8f0', cursor:onClick?'pointer':'default',
      boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
    }}
    whileHover={onClick ? { y:-2, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' } : {}}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <span style={{ color:'#94a3b8', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
      <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:bg }}>
        <Icon size={15} style={{ color }}/>
      </div>
    </div>
    <p style={{ color:'#0f172a', fontSize:34, fontWeight:900, lineHeight:1, fontFamily:"'DM Sans',sans-serif" }}>{value ?? '—'}</p>
    <p style={{ color:'#94a3b8', fontSize:11, marginTop:5 }}>{sub}</p>
  </motion.div>
);

const AuthorityOverview = ({ onNavigate, onSelect }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints').then(({ data: all }) => {
      const pending    = all.filter(c => c.status === 'pending').length;
      // ✅ FIX: worker_accepted was already in original but STATUS_META didn't have it —
      //         now consistent. Filter is correct.
      const inProgress = all.filter(c =>
        ['officer_assigned','worker_assigned','worker_accepted','in_progress'].includes(c.status)
      ).length;
      const resolved   = all.filter(c => ['resolved','closed'].includes(c.status)).length;
      const breached   = all.filter(c => c.slaBreached).length;
      const recent     = [...all].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
      setData({ pending, inProgress, resolved, breached, recent });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:260, gap:10, color:'#94a3b8' }}>
      <Loader2 size={20} className="animate-spin" style={{ color:'#2563eb' }}/> <span style={{ fontSize:13 }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }} className="lg:grid-cols-4">
        <StatCard label="Pending"      value={data?.pending}    sub="Awaiting assignment"  color="#d97706" bg="#fef3c7" icon={Clock}        delay={0}    onClick={() => onNavigate('queue')}/>
        <StatCard label="In Progress"  value={data?.inProgress} sub="Officers deployed"    color="#2563eb" bg="#dbeafe" icon={Zap}          delay={0.06}/>
        <StatCard label="Resolved"     value={data?.resolved}   sub="Completed"            color="#059669" bg="#d1fae5" icon={CheckCircle2} delay={0.12}/>
        <StatCard label="SLA Breached" value={data?.breached}   sub="Urgent action needed" color="#dc2626" bg="#fee2e2" icon={Flame}        delay={0.18} onClick={() => onNavigate('queue')}/>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
        {[
          { label:'Pending Queue',    sub:`${data?.pending||0} need assignment`,       color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', page:'queue',     Icon:AlertTriangle },
          { label:'Manage Workers',   sub:'Add & track field staff',                    color:'#059669', bg:'#ecfdf5', border:'#a7f3d0', page:'workers',   Icon:Zap },
          { label:'Map View',         sub:'See complaints by location',                 color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', page:'map',       Icon:TrendingUp },
          { label:'Analytics',        sub:'Resolution rates & trends',                  color:'#0369a1', bg:'#f0f9ff', border:'#bae6fd', page:'analytics', Icon:TrendingUp },
        ].map(q => (
          <motion.button key={q.page} whileHover={{ y:-2, boxShadow:'0 4px 14px rgba(0,0,0,0.08)' }} whileTap={{ scale:0.98 }}
            onClick={() => onNavigate(q.page)}
            style={{ textAlign:'left', padding:16, borderRadius:14, cursor:'pointer', background:'#fff',
              border:`1px solid ${q.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:q.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
              <q.Icon size={14} style={{ color:q.color }}/>
            </div>
            <p style={{ color:'#0f172a', fontWeight:800, fontSize:13, marginBottom:3 }}>{q.label}</p>
            <p style={{ color:'#94a3b8', fontSize:11 }}>{q.sub}</p>
          </motion.button>
        ))}
      </div>

      {/* Recent */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ color:'#0f172a', fontWeight:800, fontSize:14 }}>Recent Complaints</h3>
          <button onClick={() => onNavigate('queue')}
            style={{ color:'#2563eb', fontSize:12, fontWeight:700, cursor:'pointer', background:'none', border:'none' }}>
            View all →
          </button>
        </div>
        <div>
          {data?.recent?.map((c, i) => {
            // ✅ FIX: fallback to pending meta if status unknown — prevents crashes
            const s = STATUS_META[c.status] || STATUS_META.pending;
            return (
              <motion.div key={c._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                onClick={() => onSelect(c._id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', cursor:'pointer',
                  borderBottom: i < (data.recent.length-1) ? '1px solid #f8fafc' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ width:36, height:36, borderRadius:10, background:s.bg, border:`1px solid ${s.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                  {CAT_ICON[c.category]||'📋'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'#0f172a', fontWeight:700, fontSize:13 }} className="truncate">{c.title||`${c.category} Issue`}</p>
                  <p style={{ color:'#94a3b8', fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
                    {c.ticketId||`#${c._id?.slice(-6).toUpperCase()}`} · {c.vibhag}
                  </p>
                </div>
                <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`,
                  borderRadius:6, padding:'3px 9px', fontSize:10, fontWeight:800, whiteSpace:'nowrap', textTransform:'capitalize' }}>
                  {c.status.replace(/_/g,' ')}
                </span>
                <ChevronRight size={14} style={{ color:'#cbd5e1', flexShrink:0 }}/>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuthorityOverview;