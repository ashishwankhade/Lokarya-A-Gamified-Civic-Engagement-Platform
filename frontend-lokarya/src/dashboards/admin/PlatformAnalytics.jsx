/**
 * PlatformAnalytics.jsx
 * Path: src/dashboards/admin/PlatformAnalytics.jsx
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2, TrendingUp, Users, FileText, Zap, MapPin } from 'lucide-react';
import api from '../../api/axios';

const NV = '#0f2c4a';
const V  = '#7c3aed';
const OR = '#F47C20';
const G  = '#059669';

const PALETTE = [G, OR, '#2563eb', V, '#0891b2', '#dc2626', '#d97706', '#ec4899'];

const PERIODS = [
  { label:'7 days',  value:'7'  },
  { label:'30 days', value:'30' },
  { label:'90 days', value:'90' },
];

const f = (d=0) => ({ initial:{opacity:0,y:14}, animate:{opacity:1,y:0}, transition:{duration:0.38,delay:d} });

const Card = ({ children, style={} }) => (
  <div style={{ background:'#fff', borderRadius:20, border:'2px solid #f0ebe3',
    boxShadow:'0 2px 10px rgba(0,0,0,0.04)', padding:'24px 26px', ...style }}>
    {children}
  </div>
);

const ChartTitle = ({ children, sub }) => (
  <div style={{ marginBottom:18 }}>
    <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:17, color:NV, marginBottom:3 }}>{children}</h3>
    {sub && <p style={{ fontSize:12, color:'#94a3b8' }}>{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'2px solid #f0ebe3', borderRadius:12,
      padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
      fontFamily:"'DM Sans',sans-serif" }}>
      <p style={{ fontSize:12, fontWeight:800, color:NV, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:'#64748b' }}>{p.name}:</span>
          <span style={{ fontWeight:800, color:NV }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Empty = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
    height:200, color:'#94a3b8', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
    No data yet for this period.
  </div>
);

const TIER_NAMES = ['Civic Scout','Urban Guardian','Impact Maker','City Champion','Lokarya Legend'];
const TIER_MIN   = [0, 200, 500, 1000, 2000];
const getTier    = (xp) => [...TIER_MIN].reverse().findIndex(m => xp >= m);

const PlatformAnalytics = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('30');

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?period=${period}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      padding:'80px 0', color:'#94a3b8', fontFamily:"'DM Sans',sans-serif" }}>
      <Loader2 size={28} className="animate-spin" style={{ color:V, marginRight:12 }}/>
      Loading analytics…
    </div>
  );

  if (!data) return null;

  // format trend data for recharts
  const userGrowth    = (data.userGrowth    || []).map(d => ({ date: d._id.slice(5), Users: d.count }));
  const compTrend     = (data.complaintTrend || []).map(d => ({ date: d._id.slice(5), Complaints: d.count }));
  const xpTrend       = (data.xpTrend        || []).map(d => ({ date: d._id.slice(5), XP: d.total }));
  const compByStatus  = (data.complaintsByStatus   || []).map(d => ({ name: d._id?.replace(/_/g,' ') || 'unknown', count: d.count }));
  const compByCat     = (data.complaintsByCategory || []).map(d => ({ name: d._id, count: d.count }));
  const xpByAction    = (data.xpByAction    || []).map(d => ({ name: d._id?.replace(/_/g,' ') || 'other', XP: d.total, count: d.count }));
  const vibhag        = (data.vibhagBreakdown || []).map(d => ({ name: d._id, count: d.count }));
  const topEarners    = (data.topEarners     || []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, fontFamily:"'DM Sans',sans-serif" }}>

      {/* HEADER + PERIOD */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:24, color:NV, marginBottom:4 }}>
            Platform Analytics
          </h2>
          <p style={{ color:'#64748b', fontSize:14 }}>Civic trends, XP flows and user behaviour.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              style={{ padding:'9px 16px', borderRadius:10, cursor:'pointer',
                fontWeight:800, fontSize:12, fontFamily:"'DM Sans',sans-serif",
                border: period===p.value ? 'none' : '2px solid #e2e8f0',
                background: period===p.value ? NV : '#fff',
                color: period===p.value ? '#fff' : '#64748b',
                transition:'all 0.15s' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROW 1 — User growth + Complaint trend */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="ag1">
        <style>{`@media(max-width:860px){.ag1,.ag2,.ag3{grid-template-columns:1fr!important}}`}</style>

        <motion.div {...f(0.05)}>
          <Card>
            <ChartTitle sub={`New registrations last ${period} days`}>User Growth</ChartTitle>
            {userGrowth.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="Users" stroke={V} strokeWidth={3}
                    dot={{ fill:V, r:4, strokeWidth:2, stroke:'#fff' }} activeDot={{ r:6 }}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div {...f(0.1)}>
          <Card>
            <ChartTitle sub={`Complaints filed last ${period} days`}>Complaint Trend</ChartTitle>
            {compTrend.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={compTrend} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="Complaints" fill={OR} radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ROW 2 — XP trend + Complaint by status */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }} className="ag2">
        <motion.div {...f(0.15)}>
          <Card>
            <ChartTitle sub={`XP awarded per day over last ${period} days`}>XP Distribution Trend</ChartTitle>
            {xpTrend.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={xpTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="XP" stroke={OR} strokeWidth={3}
                    dot={{ fill:OR, r:4, strokeWidth:2, stroke:'#fff' }} activeDot={{ r:6 }}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div {...f(0.2)}>
          <Card>
            <ChartTitle sub="All time">Complaints by Status</ChartTitle>
            {compByStatus.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={compByStatus} cx="50%" cy="50%" outerRadius={80}
                    dataKey="count" nameKey="name" paddingAngle={3}>
                    {compByStatus.map((_,i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:10, fontFamily:"'DM Sans'" }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ROW 3 — XP by action + Vibhag breakdown + Top earners */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }} className="ag3">

        <motion.div {...f(0.25)}>
          <Card>
            <ChartTitle sub="Top 10 XP-earning actions">XP by Action</ChartTitle>
            {xpByAction.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={xpByAction.slice(0,6)} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:10, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={90}
                    tick={{ fontSize:9, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="XP" fill={V} radius={[0,6,6,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div {...f(0.3)}>
          <Card>
            <ChartTitle sub="Complaints per zone">Vibhag Heatmap</ChartTitle>
            {vibhag.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                height:200, flexDirection:'column', gap:10 }}>
                <MapPin size={32} style={{ color:'#e2e8f0' }}/>
                <span style={{ color:'#94a3b8', fontSize:12 }}>No zone data yet</span>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {vibhag.map((v, i) => {
                  const max = vibhag[0]?.count || 1;
                  const pct = Math.round((v.count / max) * 100);
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:70, fontSize:11, fontWeight:700,
                        color:'#64748b', flexShrink:0, textAlign:'right' }}>
                        {v.name}
                      </div>
                      <div style={{ flex:1, height:8, background:'#f1f5f9', borderRadius:999 }}>
                        <div style={{ height:'100%', borderRadius:999, width:`${pct}%`,
                          background:`linear-gradient(to right,${OR},#fbbf24)` }}/>
                      </div>
                      <span style={{ fontSize:11, fontWeight:800, color:OR, flexShrink:0, minWidth:24 }}>
                        {v.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...f(0.35)}>
          <Card>
            <ChartTitle sub="All time, by XP">Top 10 Citizens</ChartTitle>
            {topEarners.length === 0 ? <Empty/> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {topEarners.map((u, i) => {
                  const tierIdx  = [...TIER_MIN].reverse().findIndex(m => (u.xp||0) >= m);
                  const tierName = TIER_NAMES[TIER_NAMES.length - 1 - tierIdx] || TIER_NAMES[0];
                  const initials = u.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?';
                  return (
                    <div key={u._id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:22, fontFamily:"'Fraunces',serif", fontWeight:900,
                        fontSize:13, color: i===0 ? '#d97706' : i===1 ? '#94a3b8' : '#cd7f32',
                        textAlign:'right', flexShrink:0 }}>{i+1}</div>
                      <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0,
                        background:'linear-gradient(135deg,#7c3aed,#4c1d95)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        overflow:'hidden' }}>
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          : <span style={{ color:'#fff', fontWeight:800, fontSize:10 }}>{initials}</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:800, color:NV,
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize:10, color:'#94a3b8' }}>{tierName}</div>
                      </div>
                      <span style={{ fontFamily:"'Fraunces',serif", fontWeight:900,
                        fontSize:15, color:OR, flexShrink:0 }}>{u.xp||0}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ROW 4 — Complaints by category */}
      <motion.div {...f(0.4)}>
        <Card>
          <ChartTitle sub="All time complaint distribution by civic issue type">Complaints by Category</ChartTitle>
          {compByCat.length === 0 ? <Empty/> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compByCat} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8', fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {compByCat.map((_,i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default PlatformAnalytics;
