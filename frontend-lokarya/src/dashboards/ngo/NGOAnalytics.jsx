/**
 * NGOAnalytics.jsx
 * Analytics page for NGO dashboard.
 * Charts: volunteers over time, XP distributed, category breakdown, top missions.
 * Uses recharts (already installed).
 *
 * Path: src/dashboards/ngo/NGOAnalytics.jsx
 *
 * FIXES applied:
 *  [1] Uses useMyMissions hook → correct endpoint, all statuses
 *  [2] XP calculation now reads attendance[].totalPoints (m.volunteerCount doesn't exist)
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Zap, Award, BarChart3, Loader2,
} from 'lucide-react';
import useMyMissions from '../../hooks/useMyMissions'; // FIX [1]

const NV = '#0f2c4a';
const G  = '#059669';
const OR = '#F47C20';

const PALETTE = [G, OR, '#2563eb', '#7c3aed', '#0891b2', '#dc2626', '#d97706'];

const fade = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)', padding: '24px 26px', ...style }}>
    {children}
  </div>
);

const ChartTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700,
      fontSize: 17, color: NV, marginBottom: 3 }}>{children}</h3>
    {sub && <p style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</p>}
  </div>
);

/* ── CUSTOM TOOLTIP ──────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '2px solid #f0ebe3', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontFamily: "'DM Sans',sans-serif" }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: NV, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}/>
          <span style={{ color: '#64748b' }}>{p.name}:</span>
          <span style={{ fontWeight: 800, color: NV }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const NGOAnalytics = () => {
  // FIX [1]: use shared hook
  const { missions, loading } = useMyMissions();

  /* ── DERIVED DATA ──────────────────────────────────────────────────────── */

  const totalMissions   = missions.length;

  const totalVolunteers = missions.reduce((s, m) =>
    s + (m.attendance?.filter(a => a.finalStatus === 'present').length
      || m.participants?.filter(p => p.status === 'approved').length || 0), 0);

  /* FIX [2]: sum attendance[].totalPoints — m.volunteerCount doesn't exist */
  const totalXp = missions.reduce((s, m) =>
    s + (m.attendance?.reduce((xs, a) => xs + (a.totalPoints || 0), 0) || 0), 0);

  const completedCount = missions.filter(m => m.status === 'completed').length;

  /* volunteers per mission (bar chart) */
  const barData = missions
    .slice(-8)
    .map(m => ({
      name:       m.title.length > 18 ? m.title.slice(0, 18) + '…' : m.title,
      Volunteers: m.attendance?.filter(a => a.registrationStatus === 'registered').length
        || m.participants?.length || 0,
      Present:    m.attendance?.filter(a => a.finalStatus === 'present').length
        || m.participants?.filter(p => p.status === 'approved').length || 0,
    }));

  /* category breakdown (pie) */
  const catMap = {};
  missions.forEach(m => {
    catMap[m.category] = (catMap[m.category] || 0) + 1;
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  /* XP over months (line chart) — FIX [2]: same correct field */
  const monthMap = {};
  missions.forEach(m => {
    const d   = new Date(m.date);
    const key = `${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
    const xp  = m.attendance?.reduce((s, a) => s + (a.totalPoints || 0), 0) || 0;
    monthMap[key] = (monthMap[key] || 0) + xp;
  });
  const lineData = Object.entries(monthMap)
    .slice(-6)
    .map(([month, XP]) => ({ month, XP }));

  /* top missions by present volunteers */
  const topMissions = [...missions]
    .sort((a, b) => {
      const aV = a.attendance?.filter(x => x.finalStatus === 'present').length
        || a.participants?.filter(p => p.status === 'approved').length || 0;
      const bV = b.attendance?.filter(x => x.finalStatus === 'present').length
        || b.participants?.filter(p => p.status === 'approved').length || 0;
      return bV - aV;
    })
    .slice(0, 5);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 0', color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>
      <Loader2 size={28} className="animate-spin" style={{ color: G, marginRight: 12 }}/>
      Loading analytics…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24,
      fontFamily: "'DM Sans',sans-serif" }}>

      <motion.div {...fade(0)}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
          fontSize: 24, color: NV, marginBottom: 4 }}>Analytics</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Volunteer trends, XP distribution, and mission performance.
        </p>
      </motion.div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        {[
          { icon: BarChart3, label: 'Total Missions',   value: totalMissions,   color: NV,        bg: '#f1f5f9', delay: 0    },
          { icon: Users,     label: 'Total Volunteers', value: totalVolunteers, color: G,         bg: '#ecfdf5', delay: 0.07 },
          { icon: Zap,       label: 'XP Distributed',  value: totalXp,         color: OR,        bg: '#fff0e0', delay: 0.14 },
          { icon: Award,     label: 'Completed',        value: completedCount,  color: '#7c3aed', bg: '#f5f3ff', delay: 0.21 },
        ].map((s) => (
          <motion.div key={s.label} {...fade(s.delay)}>
            <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={22} style={{ color: s.color }}/>
              </div>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                  fontSize: 26, color: NV, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 3 }}>{s.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS ROW 1 ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
        className="analytics-grid">
        <style>{`@media(max-width:900px){.analytics-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Bar chart */}
        <motion.div {...fade(0.1)}>
          <Card>
            <ChartTitle sub="Registered vs. present per mission">Volunteer Turnout</ChartTitle>
            {barData.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barSize={18} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: "'DM Sans'" }}
                    axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: "'DM Sans'" }}
                    axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }}/>
                  <Bar dataKey="Volunteers" fill="#e2e8f0" radius={[6,6,0,0]}/>
                  <Bar dataKey="Present"    fill={G}       radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Pie chart */}
        <motion.div {...fade(0.15)}>
          <Card>
            <ChartTitle sub="Missions by category">Category Breakdown</ChartTitle>
            {pieData.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── CHARTS ROW 2 ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}
        className="analytics-grid2">
        <style>{`@media(max-width:900px){.analytics-grid2{grid-template-columns:1fr!important}}`}</style>

        {/* Line chart — XP over time */}
        <motion.div {...fade(0.2)}>
          <Card>
            <ChartTitle sub="Total XP distributed per month">XP Distributed Over Time</ChartTitle>
            {lineData.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: "'DM Sans'" }}
                    axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: "'DM Sans'" }}
                    axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="XP" stroke={OR} strokeWidth={3}
                    dot={{ fill: OR, r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Top missions leaderboard */}
        <motion.div {...fade(0.25)}>
          <Card>
            <ChartTitle sub="By volunteer count">Top Missions</ChartTitle>
            {topMissions.length === 0 ? <Empty/> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topMissions.map((m, i) => {
                  const count = m.attendance?.filter(a => a.finalStatus === 'present').length
                    || m.participants?.filter(p => p.status === 'approved').length || 0;
                  const maxCount = (
                    topMissions[0].attendance?.filter(a => a.finalStatus === 'present').length
                    || topMissions[0].participants?.filter(p => p.status === 'approved').length || 1
                  );
                  const pct = Math.round((count / maxCount) * 100);

                  return (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                        background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#fff0e0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 12,
                        color: i === 0 ? '#92400e' : i === 1 ? '#475569' : OR }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: NV,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.title}
                        </div>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, marginTop: 5 }}>
                          <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`,
                            background: `linear-gradient(to right,${G},#34d399)` }}/>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, color: G, flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const Empty = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 200, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>
    No data yet — create and complete missions to see analytics.
  </div>
);

export default NGOAnalytics;