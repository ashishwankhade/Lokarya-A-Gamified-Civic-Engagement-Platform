/**
 * RewardsPage.jsx
 * Path: src/pages/RewardsPage.jsx
 *
 * Fully aligned with the new XP engine system:
 *  ✅ Reads `user.xp`  (not totalPoints / lifetimePoints)
 *  ✅ Tier thresholds: 0 / 200 / 500 / 1000 / 2000 (matches xpEngineService.js TIERS)
 *  ✅ XP History tab reads XpLedger via GET /api/gamification/history
 *  ✅ TabSwitcher  — inlined, no SharedComponents import
 *  ✅ useUserStats — removed, replaced with direct /api/auth/me call
 *  ✅ Rank-based progress derived client-side (same getTier logic as backend)
 *  ✅ Store redemption POSTs to /api/gamification/redeem (deducts xp in XpLedger)
 *  ✅ Spending XP does NOT affect rank (rank is always derived from xp total)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Lock, Award, Shield, Crown,
  Zap, CheckCircle2, ArrowRight, ShoppingBag,
  Loader2, ShieldCheck, Clock, TrendingUp, Gift,
} from 'lucide-react';
import api         from '../api/axios';
import { toast }   from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import useLoginGate, { LoginGate } from '../hooks/useLoginGate';

// ─────────────────────────────────────────────────────────────────────────────
// TIERS — must exactly mirror xpEngineService.js TIERS array
// ─────────────────────────────────────────────────────────────────────────────
const TIERS = [
  {
    level: 1, rank: 'Civic Scout',    minXp: 0,
    Icon: Shield,
    color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', ring: '#e2e8f030',
    desc: 'Welcome! Start reporting issues to earn your first XP.',
    perks: ['File complaints', 'Track your reports', 'See city updates'],
  },
  {
    level: 2, rank: 'Urban Guardian', minXp: 200,
    Icon: Star,
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', ring: '#bfdbfe30',
    desc: 'You are now a recognised protector of Nagpur neighbourhoods.',
    perks: ['Priority complaint review', 'Guardian badge on profile', 'Monthly digest email'],
  },
  {
    level: 3, rank: 'Impact Maker',   minXp: 500,
    Icon: Zap,
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', ring: '#a7f3d030',
    desc: 'Your actions are creating visible, measurable change in the city.',
    perks: ['Early access to NGO missions', 'Impact Maker badge', 'Featured on leaderboard'],
  },
  {
    level: 4, rank: 'City Champion',  minXp: 1000,
    Icon: Award,
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', ring: '#ddd6fe30',
    desc: 'A true leader in civic responsibility — Nagpur knows your name.',
    perks: ['City Champion badge', 'Exclusive store items', 'Name in annual report'],
  },
  {
    level: 5, rank: 'Lokarya Legend', minXp: 2000,
    Icon: Crown,
    color: '#d97706', bg: '#fef3c7', border: '#fde68a', ring: '#fde68a30',
    desc: 'Hall of Fame. The ultimate civic hero of Lokarya.',
    perks: ['Legend badge', 'Physical Lokarya certificate', 'City council meeting invite'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REWARD STORE
// ─────────────────────────────────────────────────────────────────────────────
const STORE_ITEMS = [
  { id: 101, name: '₹100 Amazon Voucher', cost: 500,  category: 'Voucher',       emoji: '🛒', color: '#F47C20' },
  { id: 102, name: 'Lokarya T-Shirt',     cost: 1200, category: 'Merch',         emoji: '👕', color: '#059669' },
  { id: 103, name: 'Movie Ticket (PVR)', cost: 800,  category: 'Entertainment', emoji: '🎬', color: '#7c3aed' },
  { id: 104, name: 'Organic Food Basket', cost: 2500, category: 'Health',        emoji: '🥗', color: '#16a34a' },
  { id: 105, name: '₹50 Zomato Credit',  cost: 300,  category: 'Food',          emoji: '🍕', color: '#dc2626' },
  { id: 106, name: 'Plant a Tree (NGO)', cost: 150,  category: 'Impact',        emoji: '🌱', color: '#065f46' },
];

// ─────────────────────────────────────────────────────────────────────────────
// XP HISTORY — action label map (matches XpRule.action keys in XpRule.js)
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_META = {
  file_complaint:        { label: 'Filed a Complaint',       emoji: '📋', color: '#F47C20' },
  complaint_resolved:    { label: 'Complaint Resolved',      emoji: '✅', color: '#059669' },
  rate_feedback:         { label: 'Gave Feedback',           emoji: '⭐', color: '#d97706' },
  attend_ngo_activity:   { label: 'Attended NGO Activity',   emoji: '🤝', color: '#7c3aed' },
  verify_duplicate:      { label: 'Verified Duplicate',      emoji: '🔍', color: '#0891b2' },
  refer_friend:          { label: 'Referred a Friend',       emoji: '👫', color: '#2563eb' },
  first_complaint:       { label: 'First Complaint Bonus',   emoji: '🎉', color: '#d97706' },
  streak_7day:           { label: '7-Day Streak Bonus',      emoji: '🔥', color: '#dc2626' },
  ngo_create_mission:    { label: 'NGO Mission Approved',    emoji: '🚀', color: '#059669' },
  ngo_mission_completed: { label: 'NGO Mission Completed',   emoji: '🏁', color: '#7c3aed' },
  admin_manual_award:    { label: 'Admin Award',             emoji: '🎁', color: '#d97706' },
  redeem_reward:         { label: 'Redeemed Reward',         emoji: '🛍️', color: '#dc2626' },
};

// ─────────────────────────────────────────────────────────────────────────────
// XP HELPERS — mirrors xpEngineService.js getTier / getNextTier logic exactly
// ─────────────────────────────────────────────────────────────────────────────
const getTier     = (xp) => [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0];
const getNextTier = (xp) => TIERS.find(t => t.minXp > xp) || null;
const getProgress = (xp) => {
  const cur  = getTier(xp);
  const next = getNextTier(xp);
  if (!next) return 100;
  return Math.min(100, Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100));
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE TAB SWITCHER — replaces TabSwitcher from SharedComponents
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'milestones', label: 'Ranks & Badges', Icon: Trophy      },
  { id: 'store',      label: 'Rewards Store',  Icon: ShoppingBag },
  { id: 'history',    label: 'XP History',     Icon: Clock       },
];

const TabSwitcher = ({ active, onChange }) => (
  <div style={{
    display: 'flex', gap: 4,
    background: '#f1f5f9', borderRadius: 16, padding: 4,
    marginBottom: 28, fontFamily: "'DM Sans',sans-serif",
  }}>
    {TABS.map(({ id, label, Icon }) => {
      const on = active === id;
      return (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 7, padding: '11px 6px', borderRadius: 12, border: 'none', cursor: 'pointer',
          fontWeight: 800, fontSize: 13,
          background:   on ? '#fff'      : 'transparent',
          color:        on ? '#0f2c4a'   : '#94a3b8',
          boxShadow:    on ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          transition:   'all 0.2s',
        }}>
          <Icon size={15} /> {label}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const NV = '#0f2c4a';
const OR = '#F47C20';

const RewardsPage = () => {
  const { isLoggedIn }              = useAuth();
  const { requireLogin, gateProps } = useLoginGate();

  const [activeTab,   setActiveTab]   = useState('milestones');
  const [xp,          setXp]          = useState(0);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch user xp from /auth/me (user.xp) + ledger history
  const fetchData = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    try {
      const { data: me } = await api.get('/auth/me');
      setXp(me.xp || 0);
    } catch { /* silent */ }
    try {
      const { data: h } = await api.get('/gamification/history');
      setHistory(Array.isArray(h) ? h : []);
    } catch { /* endpoint may not exist yet — silent */ }
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived tier state
  const tier     = getTier(xp);
  const nextTier = getNextTier(xp);
  const progress = getProgress(xp);

  // ── REDEEM ──────────────────────────────────────────────────────────────────
  const handleRedeem = async (item) => {
    if (!isLoggedIn)    { requireLogin(); return; }
    if (xp < item.cost) { toast.error('Not enough XP!'); return; }
    if (!window.confirm(`Redeem "${item.name}" for ${item.cost} XP?`)) return;

    setIsRedeeming(true);
    try {
      await api.post('/gamification/redeem', { cost: item.cost, name: item.name });
      toast.success(`${item.emoji} ${item.name} redeemed!`);
      fetchData(); // re-read updated xp balance
    } catch (e) {
      toast.error(e.response?.data?.message || 'Redemption failed.');
    } finally { setIsRedeeming(false); }
  };

  if (loading && isLoggedIn) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} className="animate-spin" style={{ color: '#059669' }} />
    </div>
  );

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 72,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* Google fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;700;800;900&display=swap');
      `}</style>

      <LoginGate {...gateProps} />

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #052e1c 0%, #065f46 40%, #059669 100%)',
        paddingBottom: 88, paddingTop: 44, paddingLeft: 20, paddingRight: 20,
        borderRadius: '0 0 2.5rem 2.5rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* dot texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.045) 1px,transparent 1px)',
          backgroundSize: '22px 22px' }} />
        {/* top-right glow */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle,rgba(244,124,32,0.2) 0%,transparent 68%)' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 28, position: 'relative', zIndex: 1 }}>

          {/* left text */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 999, padding: '5px 14px', marginBottom: 14 }}>
              <Trophy size={12} style={{ color: OR }} />
              <span style={{ color: OR, fontSize: 11, fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {isLoggedIn ? `Rank: ${tier.rank}` : 'Join to Earn Ranks'}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, color: '#fff',
              fontSize: 'clamp(26px,4vw,40px)', lineHeight: 1.2, marginBottom: 8 }}>
              Rewards &amp; Ranks
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14,
              maxWidth: 400, lineHeight: 1.75 }}>
              Earn XP through civic action — report issues, attend missions, help your community.
              Redeem points for real rewards.
            </p>
          </div>

          {/* right — stats or guest CTA */}
          {isLoggedIn ? (
            <div style={{ background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              borderRadius: 20, padding: '20px 28px',
              display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                  fontSize: 34, color: OR, lineHeight: 1 }}>{xp}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Total XP</div>
              </div>
              <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.18)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                  fontSize: 20, color: '#fff', lineHeight: 1 }}>{tier.rank}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                  Level {tier.level} of 5
                </div>
              </div>
              {nextTier && (
                <>
                  <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.18)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                      fontSize: 20, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                      {nextTier.minXp - xp}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
                      textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                      XP to next
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              borderRadius: 20, padding: '24px 28px', textAlign: 'center', minWidth: 200 }}>
              <ShieldCheck size={28} style={{ color: OR, margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontWeight: 800, color: '#fff', fontSize: 14, marginBottom: 14 }}>Your XP awaits!</p>
              <button onClick={requireLogin}
                style={{ background: OR, color: '#fff', border: 'none', borderRadius: 12,
                  padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif",
                  boxShadow: '0 4px 14px rgba(244,124,32,0.45)' }}>
                Join Lokarya Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px',
        marginTop: -52, position: 'relative', zIndex: 10 }}>

        {/* Progress bar — logged-in only */}
        {isLoggedIn && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 22, padding: '22px 26px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '2px solid #f0ebe3', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Your Progress
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                    fontSize: 20, color: NV }}>{tier.rank}</span>
                  <span style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                    borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
                    Level {tier.level}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 20, color: OR }}>
                  {xp} XP
                </div>
                {nextTier && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {nextTier.minXp - xp} XP to {nextTier.rank}
                  </div>
                )}
              </div>
            </div>

            {/* progress bar */}
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 999,
                  background: `linear-gradient(to right, ${tier.color}, ${OR})` }} />
            </div>

            {/* milestone dots */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              {TIERS.map((t) => (
                <div key={t.level} style={{ display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', transition: 'background 0.4s',
                    background: xp >= t.minXp ? t.color : '#e2e8f0',
                    boxShadow: xp >= t.minXp ? `0 0 0 3px ${t.color}30` : 'none' }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: xp >= t.minXp ? t.color : '#cbd5e1' }}>
                    {t.minXp === 0 ? 'Start' : `${t.minXp}`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Guest banner */}
        {!isLoggedIn && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
              background: NV, color: '#fff', padding: '14px 22px',
              borderRadius: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            <Lock size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
              Browsing as guest.{' '}
              <span style={{ opacity: 0.6, fontWeight: 400 }}>
                Join to earn XP, unlock ranks and redeem rewards.
              </span>
            </p>
            <button onClick={requireLogin}
              style={{ background: '#fff', color: NV, border: 'none', borderRadius: 10,
                padding: '8px 16px', fontWeight: 900, fontSize: 12, cursor: 'pointer',
                flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
              Join Free
            </button>
          </motion.div>
        )}

        {/* TABS */}
        <TabSwitcher active={activeTab} onChange={setActiveTab} />

        <AnimatePresence mode="wait">

          {/* ── MILESTONES TAB ───────────────────────────────────────────── */}
          {activeTab === 'milestones' && (
            <motion.div key="milestones"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {/* How to earn XP — shown to everyone */}
              <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
                padding: '22px 26px', marginBottom: 20,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                  fontSize: 18, color: NV, marginBottom: 16 }}>How to Earn XP</h3>
                <div style={{ display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
                  {[
                    { emoji: '📋', action: 'File a complaint',     xp: '+10 XP', note: 'up to 5 per day' },
                    { emoji: '✅', action: 'Complaint resolved',   xp: '+25 XP', note: 'when authority closes it' },
                    { emoji: '⭐', action: 'Rate your experience', xp: '+5 XP',  note: 'after resolution' },
                    { emoji: '🤝', action: 'Attend NGO activity',  xp: '+50 XP', note: 'base XP per event' },
                    { emoji: '🔥', action: '7-day streak',         xp: '+50 XP', note: 'consecutive active days' },
                    { emoji: '👫', action: 'Refer a friend',       xp: '+20 XP', note: 'when they file first report' },
                  ].map((e, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: 14,
                      padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{e.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: NV }}>{e.action}</div>
                        <div style={{ fontSize: 12, color: OR, fontWeight: 900, marginTop: 1 }}>{e.xp}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{e.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier ladder */}
              <div style={{ position: 'relative' }}>
                {/* connector line */}
                <div style={{ position: 'absolute', left: 31, top: 31, bottom: 31,
                  width: 3, background: '#f1f5f9', borderRadius: 999, zIndex: 0 }} />

                {TIERS.map((t, i) => {
                  const isUnlocked = isLoggedIn ? xp >= t.minXp : t.minXp === 0;
                  const isCurrent  = isLoggedIn
                    ? tier.level === t.level
                    : t.level === 1;

                  return (
                    <motion.div key={t.level}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{ display: 'flex', gap: 16, alignItems: 'flex-start',
                        position: 'relative', zIndex: 1, marginBottom: 12,
                        opacity: isUnlocked ? 1 : 0.45, transition: 'opacity 0.3s' }}>

                      {/* icon circle */}
                      <div style={{ width: 62, height: 62, borderRadius: '50%', flexShrink: 0,
                        background: isUnlocked ? t.bg : '#f1f5f9',
                        border: `3px solid ${isUnlocked ? t.color : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCurrent ? `0 0 0 5px ${t.ring}` : 'none',
                        transition: 'all 0.3s' }}>
                        {isUnlocked
                          ? <t.Icon size={26} style={{ color: t.color }} />
                          : <Lock size={22} style={{ color: '#cbd5e1' }} />}
                      </div>

                      {/* card */}
                      <div style={{ flex: 1, background: '#fff', borderRadius: 20,
                        border: `2px solid ${isCurrent ? t.color : '#f0ebe3'}`,
                        padding: '18px 20px',
                        boxShadow: isCurrent
                          ? `0 4px 20px ${t.color}25`
                          : '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s' }}>

                        <div style={{ display: 'flex', alignItems: 'flex-start',
                          justifyContent: 'space-between', flexWrap: 'wrap',
                          gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center',
                              gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                                fontSize: 18, color: isUnlocked ? NV : '#94a3b8' }}>
                                {t.rank}
                              </span>
                              {isCurrent && isLoggedIn && (
                                <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}`,
                                  borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '2px 10px' }}>
                                  Current
                                </span>
                              )}
                              {!isLoggedIn && t.level > 1 && (
                                <span style={{ background: '#f1f5f9', color: '#94a3b8',
                                  borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '2px 10px' }}>
                                  Join to unlock
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8',
                              textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {t.minXp === 0 ? 'Starting rank' : `${t.minXp} XP required`}
                            </div>
                          </div>
                          {isUnlocked && isLoggedIn && (
                            <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: 6 }}>
                              <CheckCircle2 size={18} style={{ color: '#059669' }} />
                            </div>
                          )}
                        </div>

                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.75, marginBottom: 12 }}>
                          {t.desc}
                        </p>

                        {/* perks */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {t.perks.map((p, j) => (
                            <span key={j} style={{
                              background: isUnlocked ? t.bg : '#f8fafc',
                              color:      isUnlocked ? t.color : '#94a3b8',
                              border:     `1px solid ${isUnlocked ? t.border : '#f1f5f9'}`,
                              borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '4px 10px',
                            }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Guest CTA below ladder */}
              {!isLoggedIn && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{ marginTop: 20, background: 'linear-gradient(135deg,#ecfdf5,#eff6ff)',
                    border: '2px solid #a7f3d0', borderRadius: 22,
                    padding: '32px 28px', textAlign: 'center' }}>
                  <Trophy size={34} style={{ color: '#059669', margin: '0 auto 14px', display: 'block' }} />
                  <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                    fontSize: 20, color: NV, marginBottom: 6 }}>Ready to climb the ranks?</p>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.7 }}>
                    Create a free account and start earning XP today.
                  </p>
                  <button onClick={requireLogin}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#059669', color: '#fff', border: 'none', borderRadius: 14,
                      padding: '13px 30px', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                      fontFamily: "'DM Sans',sans-serif",
                      boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}>
                    Start Earning XP <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── STORE TAB ────────────────────────────────────────────────── */}
          {activeTab === 'store' && (
            <motion.div key="store"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* XP balance banner for logged-in */}
              {isLoggedIn && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff', borderRadius: 16, border: '2px solid #f0ebe3',
                  padding: '14px 20px', marginBottom: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <Zap size={20} style={{ color: OR }} fill={OR} />
                  <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, color: OR }}>
                    {xp} XP
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>available</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: '#94a3b8', maxWidth: 200, textAlign: 'right', lineHeight: 1.5 }}>
                    Spending XP does not affect your rank
                  </span>
                </div>
              )}

              {/* Guest teaser */}
              {!isLoggedIn && (
                <div style={{ background: '#fff', border: '2px dashed #bfdbfe',
                  borderRadius: 22, padding: '44px 24px', textAlign: 'center', marginBottom: 24 }}>
                  <ShoppingBag size={40} style={{ color: '#bfdbfe', margin: '0 auto 14px', display: 'block' }} />
                  <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                    fontSize: 20, color: NV, marginBottom: 6 }}>Unlock the Rewards Store</p>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20,
                    maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.7 }}>
                    Earn XP by reporting issues and joining missions. Redeem for vouchers, merch, and more.
                  </p>
                  <button onClick={requireLogin}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: NV, color: '#fff', border: 'none', borderRadius: 14,
                      padding: '13px 30px', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                      fontFamily: "'DM Sans',sans-serif",
                      boxShadow: '0 4px 16px rgba(15,44,74,0.3)' }}>
                    Join to Redeem <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Store grid */}
              <div style={{ display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 18 }}>
                {STORE_ITEMS.map((item, i) => {
                  const canAfford = isLoggedIn && xp >= item.cost;
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{ background: '#fff', borderRadius: 22, border: '2px solid #f0ebe3',
                        overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        display: 'flex', flexDirection: 'column' }}>

                      {/* emoji banner */}
                      <div style={{ height: 110, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 52, position: 'relative',
                        background: `linear-gradient(135deg,${item.color}15,${item.color}06)`,
                        borderBottom: '2px solid #f0ebe3' }}>
                        {item.emoji}
                        {!isLoggedIn && (
                          <div style={{ position: 'absolute', inset: 0,
                            background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(2px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={22} style={{ color: '#cbd5e1' }} />
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '16px 18px 20px', flex: 1,
                        display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800,
                            background: `${item.color}18`, color: item.color,
                            borderRadius: 999, padding: '2px 8px',
                            textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.category}
                          </span>
                          <h3 style={{ fontWeight: 800, fontSize: 15, color: NV,
                            marginTop: 7, lineHeight: 1.3 }}>{item.name}</h3>
                        </div>

                        {/* cost */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Zap size={16} style={{ color: OR }} fill={OR} />
                          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                            fontSize: 22, color: OR }}>{item.cost}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>XP</span>
                        </div>

                        {/* redeem button */}
                        <button onClick={() => handleRedeem(item)}
                          disabled={isLoggedIn && (!canAfford || isRedeeming)}
                          style={{ marginTop: 'auto', width: '100%', padding: '12px',
                            borderRadius: 14, border: 'none', fontWeight: 800, fontSize: 14,
                            fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                            cursor: isLoggedIn && !canAfford ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: !isLoggedIn       ? NV
                              : canAfford                 ? item.color
                              : '#f1f5f9',
                            color: !isLoggedIn ? '#fff' : canAfford ? '#fff' : '#94a3b8',
                            opacity: isRedeeming ? 0.7 : 1,
                            boxShadow: (canAfford || !isLoggedIn)
                              ? `0 4px 14px ${isLoggedIn ? item.color : NV}35` : 'none',
                          }}>
                          {!isLoggedIn ? (
                            <><Lock size={14} /> Login to Redeem</>
                          ) : canAfford ? (
                            isRedeeming
                              ? <Loader2 size={16} className="animate-spin" />
                              : <><Gift size={14} /> Redeem</>
                          ) : (
                            <><Lock size={14} /> Need {item.cost - xp} more XP</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <motion.div key="history"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {!isLoggedIn ? (
                <div style={{ background: '#fff', border: '2px dashed #e2e8f0',
                  borderRadius: 22, padding: '64px 24px', textAlign: 'center' }}>
                  <Clock size={40} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
                  <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                    fontSize: 20, color: NV, marginBottom: 6 }}>Your XP History</p>
                  <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                    Sign in to see every XP transaction on your account.
                  </p>
                  <button onClick={requireLogin}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: NV, color: '#fff', border: 'none', borderRadius: 14,
                      padding: '12px 26px', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                      fontFamily: "'DM Sans',sans-serif" }}>
                    Sign In <ArrowRight size={15} />
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 22, border: '2px dashed #e2e8f0',
                  padding: '64px 24px', textAlign: 'center' }}>
                  <TrendingUp size={40} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
                  <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                    fontSize: 20, color: NV, marginBottom: 6 }}>No XP yet</p>
                  <p style={{ fontSize: 14, color: '#94a3b8' }}>
                    File your first complaint or attend an NGO mission to start earning!
                  </p>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 22, border: '2px solid #f0ebe3',
                  overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '2px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={16} style={{ color: '#94a3b8' }} />
                    <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                      fontSize: 17, color: NV }}>Recent XP Transactions</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
                      Last {history.length} entries
                    </span>
                  </div>

                  {history.map((entry, i) => {
                    const meta   = ACTION_META[entry.action] || { label: entry.action, emoji: '⚡', color: '#64748b' };
                    const isGain = entry.xp >= 0;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 14,
                          padding: '15px 24px',
                          borderBottom: i < history.length - 1 ? '1px solid #f1f5f9' : 'none',
                          transition: 'background 0.15s', cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                        {/* emoji badge */}
                        <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                          background: `${meta.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22 }}>
                          {meta.emoji}
                        </div>

                        {/* label + date */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: NV }}>{meta.label}</div>
                          {entry.meta?.note && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              {entry.meta.note}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                            {new Date(entry.createdAt).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: 'numeric', minute: '2-digit',
                            })}
                          </div>
                        </div>

                        {/* XP delta + running balance */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 18,
                            color: isGain ? '#059669' : '#dc2626' }}>
                            {isGain ? '+' : ''}{entry.xp} XP
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            Balance: {entry.balance}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default RewardsPage;
