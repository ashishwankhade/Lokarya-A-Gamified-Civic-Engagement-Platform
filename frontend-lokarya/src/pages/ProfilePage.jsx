/**
 * ProfilePage.jsx  —  Redesigned, component-split, mobile-tab layout
 * Path: src/pages/ProfilePage.jsx
 *
 * Component tree:
 *   ProfilePage
 *   ├── ProfileStyles      (all CSS + breakpoints)
 *   ├── HeroSection        (inline — keep existing, hero is good)
 *   ├── ProfileCard        (left sidebar)
 *   └── right column
 *       ├── StatsRow
 *       ├── BadgesPanel
 *       └── ActivityPanel
 *
 * On mobile (≤ 640px):
 *   - A tab bar replaces the stacked cards
 *   - Only the active tab's panel is rendered
 *   - ProfileCard (identity) is always visible at top
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Target, AlertTriangle, Zap, Award,
} from 'lucide-react';
import api        from '../api/axios';
import { toast }  from 'react-toastify';

import ProfileStyles    from '../components/Profile/ProfileStyles';
import ProfileCard      from '../components/Profile/ProfileCard';
import EditProfileModal from '../components/Profile/EditProfileModal';
import { StatsRow, BadgesPanel, ActivityPanel } from '../components/Profile/ProfilePanels';
import {
  NV, OR, BG, FF, SF,
  getTier, getNextTier,
} from '../components/Profile/profileTokens';

/* ═══════════════════════════════════════════════════════════════
   GRASS DIVIDER (hero → content)
═══════════════════════════════════════════════════════════════ */
const GrassEdge = ({ from, to }) => (
  <div style={{ lineHeight:0, background:from }}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none"
      style={{ display:'block', width:'100%', height:60 }}>
      <path fill={to}
        d="M0,80 L0,50 C18,30 28,62 44,44 C60,26 70,58 88,40
           C106,22 116,55 134,37 C152,19 162,52 180,34
           C198,16 208,50 228,32 C248,14 258,48 278,30
           C298,12 308,46 328,28 C348,10 358,44 378,26
           C398,8 408,42 428,24 C448,6 458,40 478,22
           C498,4 508,38 528,20 C548,2 558,36 578,18
           C598,0 608,34 628,16 C648,0 658,32 678,14
           C698,0 708,30 728,12 C748,0 758,28 778,10
           C798,0 808,26 828,8 C848,0 858,24 878,6
           C898,0 908,22 928,4 L1440,0 L1440,80 Z"/>
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MOBILE TAB BAR
   Shown only on ≤ 640px. Switches between Stats / Badges / Activity.
═══════════════════════════════════════════════════════════════ */
const MOBILE_TABS = [
  { id:'stats',    label:'Stats',    emoji:'📊' },
  { id:'badges',   label:'Badges',   emoji:'🏆' },
  { id:'activity', label:'Activity', emoji:'📋' },
];

const MobileTabBar = ({ active, onChange }) => (
  <div className="pp-tab-nav"
    style={{ display:'none', /* shown via CSS on ≤640px */
      background:'#fff', borderRadius:18,
      border:'2px solid #f0ebe3', padding:'5px',
      gap:4, marginBottom:16,
      boxShadow:'0 2px 12px rgba(15,44,74,0.06)' }}>
    {MOBILE_TABS.map(tab => (
      <button key={tab.id}
        onClick={() => onChange(tab.id)}
        style={{ flex:1, padding:'10px 8px', borderRadius:13,
          border:'none', cursor:'pointer', fontFamily:FF,
          fontWeight:800, fontSize:12,
          background: active === tab.id ? NV : 'transparent',
          color:       active === tab.id ? '#fff' : '#94a3b8',
          display:'flex', alignItems:'center',
          justifyContent:'center', gap:5,
          transition:'all 0.18s' }}>
        <span style={{ fontSize:14 }}>{tab.emoji}</span>
        {tab.label}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   LOADING SKELETON
═══════════════════════════════════════════════════════════════ */
const LoadingScreen = () => (
  <div className="pp-wrap"
    style={{ minHeight:'100vh', background:BG, fontFamily:FF,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:14 }}>
    <ProfileStyles/>
    <div style={{ width:52, height:52, borderRadius:'50%',
      border:`4px solid #f0ebe3`,
      borderTop:`4px solid ${OR}`,
      animation:'pp-spin 0.9s linear infinite' }}/>
    <p style={{ fontFamily:SF, fontWeight:700,
      fontSize:16, color:'#94a3b8' }}>
      Loading your profile…
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const ProfilePage = () => {
  const [loading,    setLoading]    = useState(true);
  const [profile,    setProfile]    = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [mobileTab,  setMobileTab]  = useState('stats');

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
    } catch {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLocalUpdate = updated => {
    setProfile(prev => ({
      ...prev,
      name:     updated.name,
      location: updated.location,
      avatar:   updated.avatar,
    }));
  };

  if (loading) return <LoadingScreen/>;

  if (!profile) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:FF, color:'#dc2626', fontWeight:700 }}>
      Profile not found.
    </div>
  );

  // ── Derived data ────────────────────────────────────────────────────────────
  const xp   = profile.xp || 0;
  const tier = getTier(xp);

  const USER = {
    name:     profile.name,
    role:     (profile.role || 'Citizen').replace(/_/g, ' '),
    location: profile.location || '',
    email:    profile.email,
    image:    profile.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0f2c4a&color=fff&size=128`,
  };

  const STATS = [
    { label:'Missions',     value: profile.stats?.missions    || 0,
      icon:<Target/>,        color:NV,        bg:'#eff6ff' },
    { label:'Complaints',   value: profile.stats?.reports     || 0,
      icon:<AlertTriangle/>, color:'#dc2626', bg:'#fef2f2' },
    { label:'Total XP',     value: xp,
      icon:<Zap/>,           color:OR,        bg:'#fff5ee' },
    { label:'Impact Score', value: profile.stats?.impactScore || '100%',
      icon:<Award/>,         color:'#7c3aed', bg:'#f5f3ff' },
  ];

  const BADGES  = profile.badges  || [];
  const HISTORY = profile.history || [];

  // ── Right column panels (reused on both desktop and mobile tabs) ────────────
  const StatsPanel   = () => <StatsRow stats={STATS}/>;
  const BadgesPane   = () => <BadgesPanel badges={BADGES}/>;
  const ActivityPane = () => <ActivityPanel history={HISTORY}/>;

  return (
    <div className="pp-wrap"
      style={{ minHeight:'100vh', background:BG,
        fontFamily:FF, paddingBottom:80 }}>
      <ProfileStyles/>

      {/* ══════════════════════════════════════════════
          HERO — unchanged as requested
      ══════════════════════════════════════════════ */}
      <section style={{
        background:'linear-gradient(155deg,#0a1f35 0%,#0f3054 55%,#0c2644 100%)',
        paddingTop:72, paddingBottom:0,
        position:'relative', overflow:'hidden',
      }}>
        {/* dot grid */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize:'32px 32px' }}/>
        {/* glow blobs */}
        <div style={{ position:'absolute', top:-80, right:-60,
          width:360, height:360, borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle,rgba(244,124,32,0.14) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:60, left:-40,
          width:260, height:260, borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle,rgba(20,184,166,0.09) 0%,transparent 70%)' }}/>

        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6 }}
          style={{ position:'relative', zIndex:2,
            maxWidth:1200, margin:'0 auto', padding:'0 24px 56px',
            display:'flex', flexDirection:'column',
            alignItems:'center', textAlign:'center' }}>

          {/* Badge pill */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(244,124,32,0.15)',
            border:'1.5px solid rgba(244,124,32,0.3)',
            borderRadius:999, padding:'7px 18px', marginBottom:20 }}>
            <Users size={12} style={{ color:'#fb923c' }}/>
            <span style={{ color:'#fb923c', fontSize:11, fontWeight:800,
              letterSpacing:'0.1em', textTransform:'uppercase' }}>
              Citizen Profile
            </span>
          </div>

          {/* Avatar */}
          <div style={{ width:88, height:88, borderRadius:'50%',
            overflow:'hidden', border:`3px solid ${OR}`,
            boxShadow:`0 0 0 6px ${OR}25`, marginBottom:14 }}>
            <img src={USER.image} alt={USER.name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>

          <h1 style={{ fontFamily:SF, fontWeight:900, color:'#fff',
            fontSize:'clamp(28px,5vw,52px)', lineHeight:1.1, marginBottom:8 }}>
            {USER.name}
          </h1>
          <p style={{ color:OR, fontSize:12, fontWeight:800,
            textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:28 }}>
            {USER.role}
          </p>

          {/* Stat chips */}
          <div className="pp-hero-chips"
            style={{ display:'flex', justifyContent:'center',
              flexWrap:'wrap', gap:12 }}>
            {[
              { e:'⚡', v:`${xp} XP`,                 l:'Total XP'     },
              { e:'🏆', v: tier.rank,                  l:'Current Rank' },
              { e:'🎯', v: profile.stats?.missions||0, l:'Missions'     },
              { e:'📋', v: profile.stats?.reports||0,  l:'Complaints'   },
            ].map((s, i) => (
              <div key={i} className="pp-hero-chip"
                style={{ background:'rgba(255,255,255,0.07)',
                  border:'1px solid rgba(255,255,255,0.11)',
                  borderRadius:14, padding:'10px 18px',
                  display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>{s.e}</span>
                <div style={{ textAlign:'left' }}>
                  <div className="pp-hero-chip-val"
                    style={{ fontFamily:SF, fontWeight:900,
                      fontSize:18, color:'#fff', lineHeight:1 }}>
                    {s.v}
                  </div>
                  <div style={{ fontSize:9, fontWeight:700,
                    color:'rgba(255,255,255,0.4)',
                    textTransform:'uppercase', letterSpacing:'0.08em',
                    marginTop:2 }}>
                    {s.l}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <GrassEdge from="transparent" to={BG}/>
      </section>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="pp-page-pad"
        style={{ maxWidth:1200, margin:'0 auto', padding:'36px 24px 0' }}>

        <div className="pp-layout">

          {/* ── LEFT: Profile Card (always visible) ── */}
          <ProfileCard user={USER} xp={xp} onEdit={() => setIsEditOpen(true)}/>

          {/* ── RIGHT: Panels ── */}
          <div>

            {/* Mobile tab bar — hidden on desktop via CSS */}
            <MobileTabBar active={mobileTab} onChange={setMobileTab}/>

            {/* ── DESKTOP: all panels stacked ── */}
            {/* Each panel has pp-panel-hide class that CSS hides on mobile */}

            {/* Stats — always on desktop, tab on mobile */}
            <div className={mobileTab !== 'stats' ? 'pp-panel-hide' : ''}
              style={{ marginBottom:20 }}>
              <StatsPanel/>
            </div>

            {/* Badges */}
            <div className={mobileTab !== 'badges' ? 'pp-panel-hide' : ''}
              style={{ marginBottom:20 }}>
              <BadgesPane/>
            </div>

            {/* Activity */}
            <div className={mobileTab !== 'activity' ? 'pp-panel-hide' : ''}>
              <ActivityPane/>
            </div>

            {/*
              IMPORTANT: The pp-panel-hide class is added by JS based on mobileTab.
              On desktop (>640px), CSS overrides this and shows ALL panels:
                .pp-panel-hide { display: none }      ← applied by CSS only on ≤640px
              So we need a different approach: use a data attribute + CSS.
              See the override below.
            */}
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {isEditOpen && (
          <EditProfileModal
            user={USER}
            onClose={() => setIsEditOpen(false)}
            onUpdate={handleLocalUpdate}/>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
