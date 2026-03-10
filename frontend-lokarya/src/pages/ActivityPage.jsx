/**
 * ActivityPage.jsx  — REFACTORED
 * Uses shared components from src/components/shared/lokarya-ui.jsx
 *
 * Removed ~180 lines of duplicated code:
 *   WaveDown, GrassEdge, ImpactStats, HowToJoin, CTABanner,
 *   CommunityStrip, GlobalStyles, StickyTabBar, GuestBanner,
 *   LoadingState, EmptyState, LockedState — all imported.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, CheckCircle, ArrowRight,
  Flag, Zap, ShieldCheck, Lock, Loader2,
  Star, QrCode, ScanLine, Clock, XCircle,
  AlertTriangle, Trophy,
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import useLoginGate, { LoginGate } from '../hooks/useLoginGate';

import {
  NV, OR, FF, SF, BG,
  GlobalStyles, WaveDown, GrassEdge,
  StickyTabBar, GuestBanner, HowToSection,
  ImpactStatsSection, CTABanner, CommunityStrip,
  LoadingState, EmptyState, LockedState,
  StatPill, PageHeroShell,
} from '../components/shared/lokarya-ui';

/* ─── Category meta ─────────────────────────────────────────────── */
const CAT_META = {
  Environment:      { c: '#059669', bg: '#ecfdf5', e: '🌱' },
  Education:        { c: '#2563eb', bg: '#dbeafe', e: '📚' },
  Healthcare:       { c: '#dc2626', bg: '#fee2e2', e: '❤️'  },
  Social:           { c: '#7c3aed', bg: '#ede9fe', e: '🤝' },
  'Animal Welfare': { c: '#d97706', bg: '#fef3c7', e: '🐾' },
  Sanitation:       { c: '#0891b2', bg: '#e0f2fe', e: '🧹' },
  'Disaster Relief':{ c: '#ea580c', bg: '#ffedd5', e: '🚨' },
};

/* ─── Static data ───────────────────────────────────────────────── */
const HOW_STEPS = [
  { n: '01', t: 'Create an Account',    d: "Sign up free and join Nagpur's civic movement. Your profile tracks every contribution you make." },
  { n: '02', t: 'Register for a Mission', d: 'Browse active missions, check the date & location, then hit Register before the deadline closes.' },
  { n: '03', t: 'Show Up & Scan QR',    d: "Attend the event in person. Scan the NGO's QR code on-site to mark your attendance — GPS confirms you're there." },
  { n: '04', t: 'Earn XP & Level Up',   d: 'Once the NGO closes the event, XP is auto-credited. Early birds, streaks, and friend bonuses stack up!' },
];

const IMPACT_STATS = [
  { e: '🌍', v: '380+',  l: 'Issues Resolved', t: 'Helping Nagpur',  d: 'Complaints filed across all 19 vibhags resolved through citizen-authority collaboration.' },
  { e: '⚡', v: '2,400+',l: 'Active Citizens',  t: 'Earn your impact',d: 'Citizens earn XP through reports, missions, and verifications — fuelling civic change.' },
  { e: '🤝', v: '60+',   l: 'Live Missions',   t: 'NGO Partnerships', d: 'Strong NGO platforms driving on-ground missions across Nagpur every single week.' },
];

const VOLUNTEER_STORIES = [
  { n: 'Priya Sharma',   r: 'Environmental Volunteer', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400', q: 'Earned 800 XP in one month just by planting trees and cleaning Ambazari Lake!' },
  { n: 'Rahul Deshmukh', r: 'Ward-level Reporter',     img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400', q: 'My complaint about the broken road got fixed in 48 hours. Lokarya actually works.' },
  { n: 'Sneha Kulkarni', r: 'NGO Coordinator',         img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', q: 'We posted a mission and had 30 volunteers join within a day. Unbelievable!' },
];

/* ═══════════════════════════════════════════════════════════════════
   MISSION CARD
═══════════════════════════════════════════════════════════════════ */
const MissionCard = ({ mission, onJoin, isLoggedIn, loading }) => {
  const cat = CAT_META[mission.category] || { c: '#64748b', bg: '#f1f5f9', e: '📋' };
  const registered = mission.attendance?.filter(a => a.registrationStatus === 'registered').length || 0;
  const total = mission.maxParticipants || 1;
  const spots = Math.max(0, total - registered);
  const pct   = Math.min(100, Math.round((registered / total) * 100));

  return (
    <motion.div className="mc" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.4 }}
      style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', border: '2px solid #f0ebe3',
        display: 'flex', flexDirection: 'column', fontFamily: FF, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

      {/* image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0 }}>
        <img src={mission.banner || 'https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=600'}
          alt={mission.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,31,53,0.7) 0%,transparent 55%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, background: cat.bg, color: cat.c,
          fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
          letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {cat.e} {mission.category}
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5,
          background: 'linear-gradient(135deg,#F47C20,#f59e0b)', borderRadius: 999, padding: '5px 12px',
          boxShadow: '0 4px 12px rgba(244,124,32,0.45)' }}>
          <Zap size={12} fill="#fff" color="#fff" />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>+{mission.pointsReward} XP</span>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ color: OR, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          {mission.ngo?.organizationName || mission.ngo?.name || 'Community Guild'}
        </p>
        <h3 style={{ fontFamily: SF, fontWeight: 700, fontSize: 18, color: '#0f1c2e', lineHeight: 1.3, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {mission.title}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { I: Calendar, t: new Date(mission.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
            { I: MapPin,   t: mission.location?.name || 'Nagpur' },
          ].map(({ I, t }, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 12 }}>
              <I size={12} style={{ color: OR }} /> {t}
            </span>
          ))}
        </div>

        {mission.deadline && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 10px', width: 'fit-content' }}>
            <Clock size={10} style={{ color: '#d97706' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e' }}>
              Register by {new Date(mission.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}

        {/* progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              <Users size={11} style={{ display: 'inline', marginRight: 4 }} />{spots} spots left
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`,
              background: 'linear-gradient(to right,#F47C20,#f59e0b)', transition: 'width 0.6s' }} />
          </div>
        </div>

        {/* mini stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { bg: '#fffbf5', border: '#fde8c8', label: 'Joined', value: registered, color: '#0f1c2e' },
            { bg: '#f0fdf4', border: '#bbf7d0', label: 'Max',    value: total,      color: '#059669' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: '8px 12px', border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: SF, fontWeight: 900, fontSize: 17, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <button onClick={onJoin} disabled={loading} className="ob"
          style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 12, cursor: 'pointer', border: 'none',
            background: NV, color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FF,
            boxShadow: '0 4px 14px rgba(15,44,74,0.2)', opacity: loading ? 0.6 : 1 }}>
          {!isLoggedIn && <Lock size={14} />}
          {loading ? 'Registering…' : isLoggedIn ? 'Register for Mission' : 'Login to Join'}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FEATURED CAMPAIGN
═══════════════════════════════════════════════════════════════════ */
const FeaturedCampaign = ({ mission, onJoin }) => {
  if (!mission) return null;
  const registered = mission.attendance?.filter(a => a.registrationStatus === 'registered').length || 0;
  const spots    = Math.max(0, (mission.maxParticipants || 0) - registered);
  const daysLeft = Math.max(0, Math.ceil((new Date(mission.date) - Date.now()) / 86400000));

  return (
    <section style={{ background: '#fff', padding: '80px 24px', fontFamily: FF }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />
            <span style={{ color: OR, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Spotlight</span>
            <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />
          </div>
          <h2 style={{ fontFamily: SF, fontWeight: 900, fontSize: 'clamp(28px,4vw,44px)', color: '#0f1c2e' }}>
            Featured <span style={{ color: OR, fontStyle: 'italic' }}>Campaign</span>
          </h2>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'grid', borderRadius: 24, overflow: 'hidden',
            border: '2px solid #f0ebe3', boxShadow: '0 14px 44px rgba(0,0,0,0.10)',
            gridTemplateColumns: '1fr 1fr' }}
          className="feat-c">
          <style>{`@media(max-width:768px){.feat-c{grid-template-columns:1fr!important}}`}</style>

          <div style={{ position: 'relative', minHeight: 320, overflow: 'hidden' }}>
            <img src={mission.banner || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=800'}
              alt={mission.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,rgba(10,31,53,0.55) 0%,transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg,#F47C20,#f59e0b)', borderRadius: 999, padding: '7px 16px',
              boxShadow: '0 4px 16px rgba(244,124,32,0.5)' }}>
              <Star size={12} fill="#fff" color="#fff" />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>FEATURED</span>
            </div>
          </div>

          <div style={{ background: BG, padding: '36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: OR, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              {mission.ngo?.organizationName || 'Community Guild'}
            </p>
            <h3 style={{ fontFamily: SF, fontWeight: 900, fontSize: 'clamp(20px,2.5vw,30px)', color: '#0f1c2e', lineHeight: 1.25, margin: 0 }}>
              {mission.title}
            </h3>
            {mission.description && (
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.8, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {mission.description}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { l: 'XP Reward',  v: `+${mission.pointsReward}`, c: OR,        bg: '#fff0e0' },
                { l: 'Spots Left', v: spots,                      c: '#059669', bg: '#ecfdf5' },
                { l: 'Registered', v: registered,                 c: '#2563eb', bg: '#eff6ff' },
                { l: 'Days Left',  v: daysLeft,                   c: '#7c3aed', bg: '#f5f3ff' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontFamily: SF, fontWeight: 900, fontSize: 22, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { I: Calendar, t: new Date(mission.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) },
                { I: MapPin,   t: mission.location?.name || 'Nagpur' },
              ].map(({ I, t }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <I size={13} style={{ color: OR, flexShrink: 0 }} />
                  <span style={{ color: '#64748b', fontSize: 13 }}>{t}</span>
                </div>
              ))}
            </div>
            <button onClick={onJoin} className="ob"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 12, cursor: 'pointer', border: 'none', marginTop: 'auto',
                background: NV, color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FF,
                boxShadow: '0 4px 16px rgba(15,44,74,0.2)' }}>
              Register for This Mission <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   VOLUNTEER STORIES
═══════════════════════════════════════════════════════════════════ */
const VolunteerStories = () => (
  <section style={{ background: BG, padding: '80px 24px', fontFamily: FF, overflow: 'hidden' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />
          <span style={{ color: OR, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Real Stories</span>
          <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />
        </div>
        <h2 style={{ fontFamily: SF, fontWeight: 900, fontSize: 'clamp(26px,4vw,42px)', color: '#0f1c2e' }}>
          Listen from our <span style={{ color: OR, fontStyle: 'italic' }}>volunteers</span>
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
        {VOLUNTEER_STORIES.map((v, i) => (
          <motion.div key={i} className="vc"
            initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            style={{ borderRadius: 22, overflow: 'hidden', border: '2px solid #f0ebe3', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
              <img src={v.img} alt={v.n} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,31,53,0.72) 0%,transparent 52%)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,#F47C20,#f59e0b)', borderRadius: 999, padding: '5px 12px' }}>
                <ShieldCheck size={11} color="#fff" />
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>VOLUNTEER</span>
              </div>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic', marginBottom: 16 }}>"{v.q}"</p>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={v.img} alt={v.n} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1c2e' }}>{v.n}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{v.r}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   SUCCESS MODAL
═══════════════════════════════════════════════════════════════════ */
const SuccessModal = ({ isOpen, onClose, mission }) => (
  <AnimatePresence>
    {isOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={onClose} />
        <motion.div initial={{ scale: 0.9, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 28,
            width: '100%', maxWidth: 400, overflow: 'hidden', textAlign: 'center', padding: 32,
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)', fontFamily: FF }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right,#F47C20,#f59e0b,#22c55e)' }} />
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ecfdf5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={40} style={{ color: '#16a34a' }} />
          </div>
          <h2 style={{ fontFamily: SF, fontWeight: 900, fontSize: 26, color: '#0f1c2e', marginBottom: 8 }}>Registered!</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.75 }}>
            You're signed up for <strong style={{ color: OR }}>{mission?.title}</strong>.
          </p>
          <div style={{ background: '#f0f9ff', borderRadius: 14, padding: '14px 18px', marginBottom: 16,
            border: '1.5px solid #bae6fd', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <QrCode size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>What happens next?</span>
            </div>
            <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              Show up at the venue on mission day. The NGO organiser will display a <strong>QR code</strong> — scan it with the app to mark your attendance. GPS will auto-verify your location.
            </p>
          </div>
          <div style={{ background: BG, borderRadius: 16, padding: '16px 20px', marginBottom: 24, border: '2px dashed #fde8c8' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Potential Reward</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Zap size={22} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontFamily: SF, fontWeight: 900, fontSize: 32, color: '#0f1c2e' }}>+{mission?.pointsReward} XP</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#0f2c4a,#0f3054)', color: '#fff',
              fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FF }}>
            Let's Do This! 🚀
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ═══════════════════════════════════════════════════════════════════
   ATTENDANCE STATUS BADGE
═══════════════════════════════════════════════════════════════════ */
const badgeStyle = (bg, border, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: bg, border: `1.5px solid ${border}`,
  borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 800, color,
});

const AttendanceStatusBadge = ({ attendee }) => {
  if (!attendee)
    return <div style={badgeStyle('#fef3c7','#fde68a','#92400e')}><Clock size={11}/> Registered — Awaiting Event</div>;
  if (attendee.finalStatus === 'present' && attendee.pointsCredited)
    return <div style={badgeStyle('#ecfdf5','#a7f3d0','#15803d')}><Trophy size={11}/> XP Credited ✓</div>;
  if (attendee.finalStatus === 'present')
    return <div style={badgeStyle('#ecfdf5','#a7f3d0','#15803d')}><CheckCircle size={11}/> Present — Points Pending</div>;
  if (attendee.finalStatus === 'absent')
    return <div style={badgeStyle('#fee2e2','#fecaca','#b91c1c')}><XCircle size={11}/> Marked Absent</div>;
  if (attendee.scannedAt && !attendee.gpsVerified && !attendee.gpsOverride)
    return <div style={badgeStyle('#fff7ed','#fed7aa','#c2410c')}><AlertTriangle size={11}/> GPS Mismatch — Awaiting Override</div>;
  if (attendee.scannedAt)
    return <div style={badgeStyle('#f0fdf4','#bbf7d0','#16a34a')}><ScanLine size={11}/> QR Scanned ✓</div>;
  return <div style={badgeStyle('#fef3c7','#fde68a','#92400e')}><QrCode size={11}/> Registered — Scan QR at Venue</div>;
};

/* ═══════════════════════════════════════════════════════════════════
   MY LOG TAB
═══════════════════════════════════════════════════════════════════ */
const MyLogTab = ({ myLog, loading, requireLogin, isLoggedIn }) => {
  if (!isLoggedIn)
    return <LockedState title="Your mission log is private" subtitle="Log in to see your accepted missions and track your XP progress." ctaLabel="Log In to View Log" onLogin={requireLogin} />;
  if (loading)
    return <LoadingState message="Loading your log…" />;
  if (!myLog.length)
    return <EmptyState icon={Flag} title="No missions in your log yet" subtitle="Register for a mission from the board to get started." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {myLog.map(item => {
        const attendee = item.myAttendance;
        const xpColor  = attendee?.pointsCredited ? OR : '#cbd5e1';
        return (
          <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 18, border: '2px solid #f0ebe3',
              display: 'flex', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', fontFamily: FF }}>
            {/* thumbnail */}
            <div style={{ width: 120, flexShrink: 0, position: 'relative' }}>
              <img src={item.banner || 'https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=300'}
                alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {attendee?.finalStatus === 'present' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,163,74,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={32} style={{ color: '#fff' }} />
                </div>
              )}
              {attendee?.finalStatus === 'absent' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(185,28,28,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={32} style={{ color: '#fff' }} />
                </div>
              )}
            </div>
            {/* content */}
            <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <h3 style={{ fontFamily: SF, fontWeight: 700, fontSize: 17, color: '#0f1c2e', margin: 0 }}>{item.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, margin: 0 }}>
                {item.ngo?.organizationName || 'Guild Partner'} ·{' '}
                {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <AttendanceStatusBadge attendee={attendee} />
              {attendee?.scannedAt && attendee.gpsDistanceMeters != null && (
                <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>
                  <MapPin size={10} style={{ display: 'inline', marginRight: 4, color: OR }} />
                  Scanned {Math.round(attendee.gpsDistanceMeters)}m from venue
                  {attendee.gpsOverride && ' · Manually verified by organiser'}
                </p>
              )}
              {attendee?.pointsCredited && attendee.bonusBreakdown && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {attendee.bonusBreakdown.earlyBird > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '2px 8px' }}>🐦 Early Bird +{attendee.bonusBreakdown.earlyBird}</span>}
                  {attendee.bonusBreakdown.streak > 0    && <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 8px' }}>🔥 Streak +{attendee.bonusBreakdown.streak}</span>}
                  {attendee.bonusBreakdown.bringAFriend > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', borderRadius: 6, padding: '2px 8px' }}>👥 Friend +{attendee.bonusBreakdown.bringAFriend}</span>}
                </div>
              )}
            </div>
            {/* XP column */}
            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: BG, borderLeft: '2px solid #f0ebe3' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {attendee?.pointsCredited ? 'Earned' : 'Potential'}
              </div>
              <div style={{ fontFamily: SF, fontWeight: 900, fontSize: 28, color: xpColor, lineHeight: 1 }}>
                +{attendee?.totalPoints || item.pointsReward}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', marginTop: 2 }}>XP</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
const ActivityPage = () => {
  const [activeTab,      setActiveTab]      = useState('board');
  const [missions,       setMissions]       = useState([]);
  const [myLog,          setMyLog]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(null);
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [selectedMission,setSelectedMission]= useState(null);

  const { isLoggedIn } = useAuth();
  const { requireLogin, gateProps } = useLoginGate();
  const boardRef = useRef(null);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      if (!isLoggedIn) {
        const { data } = await api.get('/activities');
        setMissions(Array.isArray(data) ? data : []); setMyLog([]); return;
      }
      const [profileRes, activitiesRes] = await Promise.all([api.get('/auth/profile'), api.get('/activities')]);
      const uid = profileRes.data._id?.toString();
      const all = Array.isArray(activitiesRes.data) ? activitiesRes.data : [];
      const getAttendee = a => a.attendance?.find(x => (typeof x.user === 'object' ? x.user._id : x.user)?.toString() === uid);
      setMissions(all.filter(a => !getAttendee(a)));
      setMyLog(all.filter(a => getAttendee(a)).map(a => ({ ...a, myAttendance: getAttendee(a) })));
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to load missions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMissions(); }, [isLoggedIn]);

  const handleRegister = async (mission) => {
    const id = mission._id || mission.id;
    if (!id) { toast.error('Invalid mission ID'); return; }
    setActionLoading(id);
    try {
      await api.post(`/activities/${id}/register`, {});
      setSelectedMission(mission); setShowSuccess(true);
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to register for mission'); }
    finally { setActionLoading(null); }
  };

  const handleJoin   = () => requireLogin();
  const featured     = missions[0] || null;

  return (
    <div className="act" style={{ minHeight: '100vh', background: BG }}>
      <GlobalStyles namespace="act" />
      <LoginGate {...gateProps} />
      <SuccessModal isOpen={showSuccess} mission={selectedMission}
        onClose={() => { setShowSuccess(false); fetchMissions(); setActiveTab('log'); }} />

      {/* HERO */}
      <PageHeroShell badge="Nagpur's Civic Missions">
        <h1 style={{ fontFamily: SF, fontWeight: 900, color: '#fff', fontSize: 'clamp(44px,7vw,82px)', lineHeight: 1.05, marginBottom: 18 }}>
          Missions
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.8, maxWidth: 500, margin: '0 auto 36px' }}>
          Explore the causes we passionately advocate for — join, earn XP, and shape Nagpur's future.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 44 }}>
          <StatPill emoji="🎯" value={missions.length || '—'} label="Active Missions" />
          <StatPill emoji="⚡" value="30+"                    label="XP per Mission"  />
          <StatPill emoji="🏙️" value="Nagpur"                 label="Our City"        />
        </div>
        <button onClick={() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="ob pring"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 30px', borderRadius: 14,
            background: OR, color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: FF,
            boxShadow: '0 8px 24px rgba(244,124,32,0.35)' }}>
          Explore Missions <ArrowRight size={18} />
        </button>
      </PageHeroShell>

      {/* STICKY TAB BAR */}
      <StickyTabBar
        tabs={[{ id: 'board', label: '🎯 Mission Board' }, { id: 'log', label: '📋 My Log' }]}
        active={activeTab} onChange={setActiveTab} />

      {/* GUEST BANNER */}
      {!isLoggedIn && activeTab === 'board' && (
        <GuestBanner message="Log in to register for missions and earn XP." onLogin={() => requireLogin()} />
      )}

      <AnimatePresence mode="wait">

        {activeTab === 'board' && (
          <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <section ref={boardRef} style={{ background: BG, padding: '60px 24px' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />
                    <span style={{ color: OR, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FF }}>Causes</span>
                  </div>
                  <h2 style={{ fontFamily: SF, fontWeight: 900, fontSize: 'clamp(26px,4vw,42px)', color: '#0f1c2e', lineHeight: 1.2, margin: 0 }}>
                    We believe what we <span style={{ color: OR, fontStyle: 'italic' }}>achieve</span>
                  </h2>
                </div>

                {loading
                  ? <LoadingState message="Loading missions…" />
                  : missions.length === 0
                    ? <EmptyState title="No active missions right now." subtitle="NGOs will post new missions soon!" />
                    : (
                      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
                        {missions.map(m => (
                          <MissionCard key={m._id} mission={m} isLoggedIn={isLoggedIn}
                            loading={actionLoading === m._id}
                            onJoin={() => requireLogin(() => handleRegister(m))} />
                        ))}
                      </div>
                    )}
              </div>
            </section>

            {featured && <FeaturedCampaign mission={featured} onJoin={handleJoin} />}

            <HowToSection
              label="Get Involved" title="How to" accent="help us"
              steps={HOW_STEPS}
              image="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=700"
              imageAlt="Volunteers"
              badge={{ emoji: '🏆', value: '60+', label: 'NGO Missions' }}
            />

            <CTABanner
              title="They need your support &"
              accent="help"
              subtitle="Join our growing movement of citizens and volunteers. Your time and effort create the change Nagpur deserves."
              ctaLabel="Join the Movement"
              onCta={handleJoin}
              image="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600"
              height={380}
            />

            <ImpactStatsSection
              title="Helped" accent="till now"
              subtitle="Real numbers from Nagpur's civic movement."
              stats={IMPACT_STATS}
            />

            <VolunteerStories />

            <CommunityStrip
              title="Join our community group"
              subtitle="For your interest, you can join and help build Nagpur together."
              ctaLabel="Join Now"
              onCta={handleJoin}
            />
          </motion.div>
        )}

        {activeTab === 'log' && (
          <motion.div key="log" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px 80px' }}>
            <MyLogTab myLog={myLog} loading={loading} requireLogin={requireLogin} isLoggedIn={isLoggedIn} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ActivityPage;
