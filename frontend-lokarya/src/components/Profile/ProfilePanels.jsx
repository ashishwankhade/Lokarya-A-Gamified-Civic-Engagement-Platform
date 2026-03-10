/**
 * ProfilePanels.jsx
 * StatsRow + BadgesPanel + ActivityPanel
 * Path: src/pages/profile/ProfilePanels.jsx
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, AlertTriangle, Zap, Award,
  TrendingUp, Flag, CheckCircle, ChevronRight,
} from 'lucide-react';
import { NV, OR, BG, FF, SF, STATUS_STYLE } from './profileTokens';

/* ─── Shared panel header ──────────────────────────────────────── */
const PanelHeader = ({ icon, iconBg, iconColor, title, subtitle, right }) => (
  <div style={{ display:'flex', alignItems:'center',
    justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:18 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:34, height:34, borderRadius:11, background:iconBg,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {React.cloneElement(icon, { size:16, style:{ color:iconColor } })}
      </div>
      <div>
        <h3 style={{ fontFamily:SF, fontWeight:900, fontSize:15,
          color:NV, lineHeight:1.2 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600, marginTop:1 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {right}
  </div>
);

/* ─── Panel wrapper ────────────────────────────────────────────── */
const Panel = ({ children, style }) => (
  <div style={{ background:'#fff', borderRadius:22,
    border:'2px solid #f0ebe3', padding:'22px',
    boxShadow:'0 2px 14px rgba(15,44,74,0.05)',
    fontFamily:FF, ...style }}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   STATS ROW
═══════════════════════════════════════════════════════════════ */
export const StatsRow = ({ stats }) => (
  <div className="pp-stats-row">
    {stats.map((s, i) => (
      <motion.div key={i} whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(15,44,74,0.10)' }}
        style={{ background:'#fff', borderRadius:20,
          border:'2px solid #f0ebe3', padding:'16px 12px',
          display:'flex', flexDirection:'column', alignItems:'center',
          gap:10, cursor:'default', fontFamily:FF,
          boxShadow:'0 2px 10px rgba(15,44,74,0.05)',
          transition:'box-shadow 0.2s' }}>
        <div style={{ width:42, height:42, borderRadius:13,
          background:s.bg, display:'flex', alignItems:'center',
          justifyContent:'center' }}>
          {React.cloneElement(s.icon, { size:19, style:{ color:s.color } })}
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:SF, fontWeight:900,
            fontSize:24, color:NV, lineHeight:1 }}>
            {s.value}
          </div>
          <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8',
            textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>
            {s.label}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   BADGES PANEL
═══════════════════════════════════════════════════════════════ */
export const BadgesPanel = ({ badges }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const CATS = {
    all:          'All',
    xp_milestone: 'XP Ranks',
    action_count: 'Actions',
    streak:       'Streaks',
    special:      'Special',
  };

  const filtered      = activeCategory === 'all' ? badges : badges.filter(b => b.category === activeCategory);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <Panel>
      <PanelHeader
        icon={<Award/>} iconBg='#fef3c7' iconColor='#d97706'
        title="Achievements"
        subtitle={`${unlockedCount}/${badges.length} unlocked`}
        right={unlockedCount > 0 && (
          <div style={{ background:'#fef3c7', border:'1.5px solid #fde68a',
            borderRadius:999, padding:'4px 12px',
            fontSize:11, fontWeight:800, color:'#92400e', flexShrink:0 }}>
            🏆 {unlockedCount} earned
          </div>
        )}
      />

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
        {Object.entries(CATS).map(([cat, label]) => (
          <button key={cat}
            className={`pp-filter-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{ background: activeCategory === cat ? NV : '#f8fafc',
              color:   activeCategory === cat ? '#fff' : '#94a3b8',
              fontFamily: FF }}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="pp-badge-grid">
        {filtered.map(badge => (
          <div key={badge.key}
            title={badge.unlocked
              ? `${badge.name}: ${badge.description}`
              : `🔒 ${badge.description}`}
            style={{ display:'flex', flexDirection:'column', alignItems:'center',
              padding:'14px 8px', borderRadius:16, cursor:'default',
              position:'relative',
              border:`2px solid ${badge.unlocked ? badge.color + '40' : '#f0ebe3'}`,
              background: badge.unlocked ? badge.color + '10' : '#f8fafc',
              opacity: badge.unlocked ? 1 : 0.38,
              filter: badge.unlocked ? 'none' : 'grayscale(0.5)',
              transition:'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => {
              if (badge.unlocked) {
                e.currentTarget.style.transform = 'scale(1.07)';
                e.currentTarget.style.boxShadow = `0 8px 22px ${badge.color}28`;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = 'none';
            }}>

            <div style={{ fontSize:24, marginBottom:6, lineHeight:1 }}>{badge.icon}</div>
            <span style={{ fontSize:9, fontWeight:800,
              color: badge.unlocked ? NV : '#94a3b8',
              textAlign:'center', textTransform:'uppercase',
              letterSpacing:'0.05em', lineHeight:1.3 }}>
              {badge.name}
            </span>
            {badge.unlocked && badge.earnedAt && (
              <span style={{ fontSize:8, color:'#94a3b8',
                fontWeight:600, marginTop:3, textAlign:'center' }}>
                {new Date(badge.earnedAt).toLocaleDateString('en-IN',{
                  day:'numeric', month:'short' })}
              </span>
            )}
            {badge.unlocked && (
              <div style={{ position:'absolute', top:6, right:6,
                width:14, height:14, borderRadius:'50%',
                background: badge.color,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <CheckCircle size={9} color="#fff"/>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 16px' }}>
          <p style={{ fontFamily:SF, fontWeight:700,
            fontSize:14, color:'#94a3b8' }}>
            No badges in this category yet.
          </p>
        </div>
      )}
    </Panel>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY PANEL
═══════════════════════════════════════════════════════════════ */
export const ActivityPanel = ({ history }) => {
  const [activeTab, setActiveTab] = useState('all');
  const filtered = history.filter(h => activeTab === 'all' || h.type === activeTab);

  return (
    <div style={{ background:'#fff', borderRadius:22,
      border:'2px solid #f0ebe3', overflow:'hidden',
      boxShadow:'0 2px 14px rgba(15,44,74,0.05)', fontFamily:FF }}>

      {/* Header */}
      <div style={{ padding:'22px 22px 0' }}>
        <PanelHeader
          icon={<TrendingUp/>} iconBg='#fff5ee' iconColor={OR}
          title="Activity History"
          subtitle="Your missions & complaints"
        />
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', borderBottom:'2px solid #f0ebe3',
        padding:'0 10px' }}>
        {['all','mission','complaint'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex:1, padding:'11px 6px', background:'none', border:'none',
              cursor:'pointer', fontFamily:FF, fontWeight:800, fontSize:12,
              color: activeTab === tab ? OR : '#94a3b8',
              textTransform:'capitalize',
              borderBottom: activeTab === tab ? `3px solid ${OR}` : '3px solid transparent',
              marginBottom:-2, transition:'color 0.15s, border-color 0.15s',
              borderRadius:'8px 8px 0 0' }}>
            {tab === 'all' ? 'All' : tab === 'mission' ? 'Missions' : 'Complaints'}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding:'8px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity:0, y:5 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-5 }}
            transition={{ duration:0.15 }}
            style={{ display:'flex', flexDirection:'column', gap:2 }}>

            {filtered.length === 0 ? (
              <div style={{ padding:'48px 24px', textAlign:'center',
                display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                <div style={{ width:56, height:56, borderRadius:18,
                  background:'#f8fafc', display:'flex',
                  alignItems:'center', justifyContent:'center' }}>
                  <Flag size={24} style={{ color:'#cbd5e1' }}/>
                </div>
                <div>
                  <p style={{ fontFamily:SF, fontWeight:900,
                    fontSize:15, color:NV, marginBottom:6 }}>
                    No activity yet
                  </p>
                  <p style={{ fontSize:13, color:'#94a3b8',
                    lineHeight:1.7, maxWidth:240 }}>
                    Start reporting issues or joining missions to build your history.
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((item, i) => {
                const st = STATUS_STYLE[item.status?.toLowerCase()] || STATUS_STYLE.default;
                return (
                  <motion.div key={item.id || i}
                    className="pp-act-item"
                    initial={{ opacity:0, x:-8 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.035 }}
                    style={{ padding:'11px 12px', display:'flex',
                      alignItems:'center', gap:12, cursor:'pointer' }}>

                    {/* Icon */}
                    <div style={{ width:38, height:38, borderRadius:12,
                      flexShrink:0,
                      background: item.type === 'mission' ? '#eff6ff' : '#fff5ee',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {item.type === 'mission'
                        ? <Target size={16} style={{ color:'#2563eb' }}/>
                        : <AlertTriangle size={16} style={{ color:OR }}/>}
                    </div>

                    {/* Text */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:SF, fontWeight:700,
                        fontSize:13, color:NV, marginBottom:3,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.title}
                      </p>
                      <div style={{ display:'flex', alignItems:'center',
                        gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10, fontWeight:800,
                          color:'#94a3b8', textTransform:'capitalize' }}>
                          {item.type}
                        </span>
                        <span style={{ fontSize:10, color:'#cbd5e1' }}>·</span>
                        <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>
                          {new Date(item.date).toLocaleDateString('en-IN',{
                            day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Right */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:st.c,
                        background:st.bg, border:`1px solid ${st.c}28`,
                        borderRadius:999, padding:'3px 10px',
                        textTransform:'uppercase', letterSpacing:'0.06em',
                        display:'inline-block', marginBottom:3 }}>
                        {item.status}
                      </div>
                      {item.points > 0 && (
                        <div style={{ fontSize:10, fontWeight:900, color:OR }}>
                          +{item.points} XP
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div style={{ padding:'10px 22px 18px',
          borderTop:'1.5px solid #f0ebe3' }}>
          <button
            style={{ width:'100%', padding:'10px', borderRadius:12,
              background:'transparent', border:`1.5px solid #f0ebe3`,
              fontFamily:FF, fontWeight:800, fontSize:13, color:OR,
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', gap:6, transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background=BG; e.currentTarget.style.borderColor=OR; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='#f0ebe3'; }}>
            View Full History <ChevronRight size={14}/>
          </button>
        </div>
      )}
    </div>
  );
};
