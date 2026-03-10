/**
 * AdminOverview.jsx
 * Path: src/dashboards/admin/AdminOverview.jsx
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, CheckCircle2, AlertTriangle,
  Zap, Building2, CheckSquare, TrendingUp,
  ArrowRight, Clock, Shield,
} from 'lucide-react';
import api from '../../api/axios';

const V  = '#7c3aed';
const NV = '#0f2c4a';
const OR = '#F47C20';

const f = (d = 0) => ({ initial: { opacity:0, y:16 }, animate: { opacity:1, y:0 }, transition: { duration:0.38, delay:d } });

/* ── STAT CARD ───────────────────────────────────────────────────────────── */
const StatCard = ({ icon:Icon, label, value, sub, color, bg, delay, onClick }) => (
  <motion.div {...f(delay)}
    onClick={onClick}
    style={{ background:'#fff', borderRadius:18, border:'2px solid #f0ebe3',
      boxShadow:'0 2px 10px rgba(0,0,0,0.05)', padding:'22px 24px',
      display:'flex', alignItems:'center', gap:16,
      cursor: onClick ? 'pointer' : 'default',
      fontFamily:"'DM Sans',sans-serif", transition:'transform 0.18s,box-shadow 0.18s' }}
    whileHover={onClick ? { y:-3, boxShadow:'0 10px 28px rgba(0,0,0,0.09)' } : {}}>
    <div style={{ width:50, height:50, borderRadius:14, background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon size={22} style={{ color }}/>
    </div>
    <div>
      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:26, color:NV, lineHeight:1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginTop:3 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{sub}</div>}
    </div>
  </motion.div>
);

/* ── QUICK ACTION ────────────────────────────────────────────────────────── */
const QuickAction = ({ icon:Icon, label, desc, color, bg, onClick }) => (
  <button onClick={onClick}
    style={{ background:'#fff', borderRadius:16, border:'2px solid #f0ebe3',
      padding:'18px 20px', textAlign:'left', cursor:'pointer', width:'100%',
      display:'flex', alignItems:'flex-start', gap:14,
      fontFamily:"'DM Sans',sans-serif", transition:'all 0.18s' }}
    onMouseEnter={e => Object.assign(e.currentTarget.style,
      { borderColor:color, transform:'translateY(-2px)', boxShadow:`0 8px 24px ${color}22` })}
    onMouseLeave={e => Object.assign(e.currentTarget.style,
      { borderColor:'#f0ebe3', transform:'translateY(0)', boxShadow:'none' })}>
    <div style={{ width:40, height:40, borderRadius:11, background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon size={20} style={{ color }}/>
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontWeight:800, fontSize:14, color:NV }}>{label}</div>
      <div style={{ fontSize:12, color:'#94a3b8', marginTop:3, lineHeight:1.6 }}>{desc}</div>
    </div>
    <ArrowRight size={15} style={{ color:'#cbd5e1', alignSelf:'center', flexShrink:0 }}/>
  </button>
);

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const AdminOverview = ({ onNavigate }) => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const u = stats?.users      || {};
  const c = stats?.complaints || {};
  const a = stats?.activities || {};
  const x = stats?.xp         || {};

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:26, fontFamily:"'DM Sans',sans-serif" }}>

      {/* WELCOME BANNER */}
      <motion.div {...f(0)} style={{
        borderRadius:22, overflow:'hidden', position:'relative',
        background:'linear-gradient(135deg, #3b0764 0%, #6d28d9 55%, #7c3aed 100%)',
        padding:'30px 34px', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
        {/* dot texture */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)',
          backgroundSize:'26px 26px' }}/>
        {/* glow orb */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320,
          borderRadius:'50%', background:'radial-gradient(circle,rgba(167,139,250,0.2) 0%,transparent 70%)',
          pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:999, padding:'5px 14px', marginBottom:14 }}>
            <Shield size={12} style={{ color:'#c4b5fd' }}/>
            <span style={{ color:'#e9d5ff', fontSize:11, fontWeight:800, letterSpacing:'0.1em',
              textTransform:'uppercase' }}>Super Admin · Full Platform Control</span>
          </div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, color:'#fff',
            fontSize:'clamp(22px,3vw,34px)', lineHeight:1.2, marginBottom:8 }}>
            Platform Command Centre
          </h2>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:14, maxWidth:480 }}>
            Manage users, approve NGO missions, configure XP rules and monitor everything across Lokarya.
          </p>
        </div>

        {/* hero chips */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', position:'relative', zIndex:1 }}>
          {[
            { v: loading ? '…' : (u.total ?? '—'),            l: 'Total Users'  },
            { v: loading ? '…' : (c.total ?? '—'),            l: 'Complaints'   },
            { v: loading ? '…' : (x.totalDistributed ?? '—'), l: 'XP Given'     },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.1)',
              border:'1px solid rgba(255,255,255,0.18)',
              borderRadius:16, padding:'14px 22px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
                fontSize:26, color:'#fff', lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)',
                textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* STAT GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16 }}>
        {[
          { icon:Users,         label:'Citizens',         value:u.citizens,           sub:`+${u.newThisMonth||0} this month`,  color:'#2563eb', bg:'#eff6ff',  delay:0    },
          { icon:Building2,     label:'NGO Accounts',     value:u.ngos,               sub:'Active orgs',                       color:'#059669', bg:'#ecfdf5',  delay:0.06 },
          { icon:FileText,      label:'Total Complaints', value:c.total,              sub:`${c.resolutionRate||0}% resolved`,   color:OR,        bg:'#fff0e0',  delay:0.12 },
          { icon:AlertTriangle, label:'Escalated',        value:c.escalated,          sub:'Needs attention',                   color:'#dc2626', bg:'#fee2e2',  delay:0.18 },
          { icon:CheckSquare,   label:'Open Missions',    value:a.open,               sub:`${a.completed||0} completed`,       color:V,         bg:'#f5f3ff',  delay:0.24 },
          { icon:Zap,           label:'XP Distributed',  value:x.totalDistributed,   sub:'All time',                          color:'#d97706', bg:'#fef3c7',  delay:0.30 },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* SECONDARY ROW */}
      {stats && (
        <motion.div {...f(0.34)}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {[
              { icon:Clock,      label:'Avg Resolution Time', value: c.avgResolutionHrs != null ? `${c.avgResolutionHrs}h` : 'N/A', color:'#0891b2', bg:'#e0f2fe' },
              { icon:TrendingUp, label:'Resolution Rate',     value: `${c.resolutionRate||0}%`,                                       color:'#059669', bg:'#ecfdf5' },
              { icon:Users,      label:'New Users (30d)',     value: u.newThisMonth||0,                                                color:V,         bg:'#f5f3ff' },
            ].map((s,i) => (
              <div key={i} style={{ background:'#fff', borderRadius:14, border:'2px solid #f0ebe3',
                padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:s.bg,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <s.icon size={20} style={{ color:s.color }}/>
                </div>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
                    fontSize:22, color:NV, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginTop:2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* QUICK ACTIONS */}
      <motion.div {...f(0.4)}>
        <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
          fontSize:18, color:NV, marginBottom:14 }}>Quick Actions</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>
          <QuickAction icon={CheckSquare} color={V}       bg='#f5f3ff' onClick={() => onNavigate('approvals')}
            label="Review Pending Missions" desc="Approve or reject NGO mission submissions"/>
          <QuickAction icon={Users}       color='#2563eb' bg='#eff6ff' onClick={() => onNavigate('users')}
            label="Manage Users"            desc="Change roles, ban accounts, award XP manually"/>
          <QuickAction icon={Zap}         color='#d97706' bg='#fef3c7' onClick={() => onNavigate('xp-engine')}
            label="Configure XP Rules"      desc="Set point values for every citizen and NGO action"/>
          <QuickAction icon={BarChart3}   color='#059669' bg='#ecfdf5' onClick={() => onNavigate('analytics')}
            label="View Analytics"          desc="Trends, top earners, complaint heatmaps"/>
        </div>
      </motion.div>
    </div>
  );
};

// eslint-disable-next-line
const BarChart3 = ({ size, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={style?.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

export default AdminOverview;
