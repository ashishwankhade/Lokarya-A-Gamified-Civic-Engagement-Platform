// src/dashboards/authority/AuthorityAnalytics.jsx — light theme
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import api from '../../api/axios';

const CAT_COLORS  = { Garbage:'#f59e0b', Roads:'#ef4444', Water:'#38bdf8', Electricity:'#fbbf24', Traffic:'#a78bfa', Other:'#94a3b8' };
const STAT_COLORS = { pending:'#f59e0b', in_progress:'#3b82f6', resolved:'#10b981', escalated:'#ef4444', closed:'#94a3b8' };

const KPICard = ({ label, value, color, bg, icon:Icon, delay }) => (
  <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
    style={{ background:'#fff', borderRadius:14, padding:'16px 18px', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
      <span style={{ color:'#94a3b8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
      <div style={{ width:28, height:28, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={13} style={{ color }}/>
      </div>
    </div>
    <p style={{ color:'#0f172a', fontWeight:900, fontSize:28, fontFamily:"'DM Sans',sans-serif" }}>{value}</p>
  </motion.div>
);

const ChartCard = ({ title, children }) => (
  <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
    <p style={{ color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:18 }}>{title}</p>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      {label && <p style={{ color:'#94a3b8', fontSize:11, marginBottom:5 }}>{label}</p>}
      {payload.map((p,i) => <p key={i} style={{ color:p.color||'#0f172a', fontSize:13, fontWeight:700 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const AuthorityAnalytics = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints').then(({ data: all }) => {
      const catMap = {};
      all.forEach(c => { catMap[c.category] = (catMap[c.category]||0)+1; });
      const byCategory = Object.entries(catMap).map(([name,count]) => ({ name, count, fill:CAT_COLORS[name]||'#94a3b8' }));

      const statMap = {};
      all.forEach(c => { const s = ['pending','in_progress','resolved','closed','escalated'].includes(c.status)?c.status:'other'; statMap[s]=(statMap[s]||0)+1; });
      const byStatus = Object.entries(statMap).map(([name,value]) => ({ name, value, fill:STAT_COLORS[name]||'#94a3b8' }));

      const total    = all.length;
      const resolved = all.filter(c=>['resolved','closed'].includes(c.status)).length;
      const rate     = total ? Math.round((resolved/total)*100) : 0;
      const breached = all.filter(c=>c.slaBreached).length;
      const escalated= all.filter(c=>c.status==='escalated').length;

      const times    = all.filter(c=>c.resolvedAt&&c.createdAt).map(c=>(new Date(c.resolvedAt)-new Date(c.createdAt))/(1000*3600));
      const avgHours = times.length ? (times.reduce((a,b)=>a+b,0)/times.length).toFixed(1) : '—';

      const trend = [];
      for (let i=6; i>=0; i--) {
        const d  = new Date(); d.setDate(d.getDate()-i);
        const ds = d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
        trend.push({
          date:ds,
          filed:    all.filter(c=>new Date(c.createdAt).toDateString()===d.toDateString()).length,
          resolved: all.filter(c=>c.resolvedAt&&new Date(c.resolvedAt).toDateString()===d.toDateString()).length,
        });
      }
      setData({ byCategory, byStatus, rate, breached, escalated, avgHours, trend });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:280, gap:10, color:'#94a3b8' }}>
      <Loader2 size={20} className="animate-spin" style={{ color:'#2563eb' }}/> <span style={{ fontSize:13 }}>Loading analytics…</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column', gap:18 }}>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
        <KPICard label="Resolution Rate" value={`${data.rate}%`}        color="#059669" bg="#d1fae5" icon={TrendingUp}  delay={0}/>
        <KPICard label="Avg Resolve"     value={`${data.avgHours}h`}    color="#d97706" bg="#fef3c7" icon={Clock}       delay={0.06}/>
        <KPICard label="SLA Breaches"   value={data.breached}           color="#dc2626" bg="#fee2e2" icon={AlertTriangle} delay={0.12}/>
        <KPICard label="Escalations"    value={data.escalated}          color="#7c3aed" bg="#ede9fe" icon={CheckCircle2} delay={0.18}/>
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>

        <div style={{ gridColumn:'span 2' }}>
          <ChartCard title="7-Day Filed vs Resolved">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.trend} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend wrapperStyle={{ fontSize:12, color:'#64748b' }}/>
                <Line type="monotone" dataKey="filed"    stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Filed"/>
                <Line type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2.5} dot={false} name="Resolved"/>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="By Category">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byCategory} margin={{ top:4, right:8, left:-20, bottom:0 }} barSize={22}>
              <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="count" radius={[6,6,0,0]} name="Complaints">
                {data.byCategory.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                {data.byStatus.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:11, color:'#64748b' }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default AuthorityAnalytics;
