/**
 * src/components/shared/lokarya-ui.jsx
 * ─────────────────────────────────────────────────────────────────
 * Shared UI primitives for Lokarya citizen pages.
 *
 * Exports
 * ───────
 * Tokens       : NV, OR, FF, SF, BG
 * Utils        : imgUrl, getTier, getNextTier, getProgress, TIERS
 * Atoms        : GlobalStyles, WaveDown, GrassEdge
 * Blocks       : SectionHeader, StatPill, StepCard
 * Sections     : PageHeroShell, StickyTabBar, GuestBanner
 *                HowToSection, ImpactStatsSection, CTABanner, CommunityStrip
 * States       : LoadingState, EmptyState, LockedState
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Lock, Flag, Loader2, Megaphone, Shield,
  Star, Zap, Award, Crown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════ */
export const NV = '#0f2c4a';
export const OR = '#F47C20';
export const FF = "'DM Sans', sans-serif";
export const SF = "'Fraunces', serif";
export const BG = '#fffbf5';

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════ */

/** Resolve a backend image path to a full URL */
const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
export const imgUrl = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${BACKEND}/${raw.replace(/^\//, '')}`;
};

/** XP tier system */
export const TIERS = [
  { level: 1, rank: 'Civic Scout',    minXp: 0,    Icon: Shield, color: '#64748b', bar: '#94a3b8' },
  { level: 2, rank: 'Urban Guardian', minXp: 200,  Icon: Star,   color: '#2563eb', bar: '#3b82f6' },
  { level: 3, rank: 'Impact Maker',   minXp: 500,  Icon: Zap,    color: '#059669', bar: '#10b981' },
  { level: 4, rank: 'City Champion',  minXp: 1000, Icon: Award,  color: '#7c3aed', bar: '#8b5cf6' },
  { level: 5, rank: 'Lokarya Legend', minXp: 2000, Icon: Crown,  color: '#d97706', bar: '#f59e0b' },
];
export const getTier     = (xp = 0) => [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0];
export const getNextTier = (xp = 0) => TIERS.find(t => t.minXp > xp) || null;
export const getProgress = (xp = 0) => {
  const cur = getTier(xp); const next = getNextTier(xp);
  if (!next) return 100;
  return Math.min(100, Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100));
};

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STYLES
   Usage: <GlobalStyles namespace="act" />   (adds .act * {box-sizing})
          <GlobalStyles namespace="cp-wrap" />
═══════════════════════════════════════════════════════════════════ */
export const GlobalStyles = ({ namespace = 'lk' }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,0,900;9..144,1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
    .${namespace} * { box-sizing: border-box; }
    .mc { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .mc:hover { transform: translateY(-7px); box-shadow: 0 22px 52px rgba(0,0,0,0.13) !important; }
    .mc img { transition: transform 0.55s ease; }
    .mc:hover img { transform: scale(1.07); }
    .ob { transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
    .ob:hover { background: ${OR} !important; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(244,124,32,0.42) !important; }
    .vc { transition: transform 0.22s; }
    .vc:hover { transform: scale(1.03); }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0    rgba(244,124,32,0.55); }
      70%  { box-shadow: 0 0 0 14px rgba(244,124,32,0);    }
      100% { box-shadow: 0 0 0 0    rgba(244,124,32,0);    }
    }
    .pring { animation: pulse-ring 2.2s infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
    .lk-input:focus, .lk-select:focus {
      border-color: ${OR} !important;
      box-shadow: 0 0 0 3px ${OR}18 !important;
      outline: none;
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════
   SVG DIVIDERS
═══════════════════════════════════════════════════════════════════ */
export const WaveDown = ({ from, to }) => (
  <div style={{ lineHeight: 0, background: from }}>
    <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 56 }}>
      <path fill={to} d="M0,56 L0,28 Q360,0 720,26 Q1080,52 1440,26 L1440,56 Z" />
    </svg>
  </div>
);

export const GrassEdge = ({ from, to }) => (
  <div style={{ lineHeight: 0, background: from }}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 80 }}>
      <path fill={to}
        d="M0,80 L0,50 C18,30 28,62 44,44 C60,26 70,58 88,40 C106,22 116,55 134,37 C152,19 162,52 180,34 C198,16 208,50 228,32 C248,14 258,48 278,30 C298,12 308,46 328,28 C348,10 358,44 378,26 C398,8 408,42 428,24 C448,6 458,40 478,22 C498,4 508,38 528,20 C548,2 558,36 578,18 C598,0 608,34 628,16 C648,0 658,32 678,14 C698,0 708,30 728,12 C748,0 758,28 778,10 C798,0 808,26 828,8 C848,0 858,24 878,6 C898,0 908,22 928,4 L1440,0 L1440,80 Z" />
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SECTION HEADER
   Usage:
     <SectionHeader label="Get Involved" title="How to" accent="help us" />
     <SectionHeader label="Spotlight" title="Featured" accent="Campaign" centered />
═══════════════════════════════════════════════════════════════════ */
export const SectionHeader = ({ label, title, accent, centered = false, style }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    style={{ marginBottom: 36, textAlign: centered ? 'center' : 'left', ...style }}>
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: centered ? 'center' : 'flex-start',
      gap: 8, marginBottom: centered ? 10 : 12,
    }}>
      {centered && <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />}
      <span style={{ color: OR, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FF }}>
        {label}
      </span>
      {centered && <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />}
      {!centered && <div style={{ width: 28, height: 3, background: OR, borderRadius: 3 }} />}
    </div>
    <h2 style={{
      fontFamily: SF, fontWeight: 900, fontSize: 'clamp(26px,4vw,44px)',
      color: '#0f1c2e', lineHeight: 1.15, margin: 0,
    }}>
      {title}{accent && <> <span style={{ color: OR, fontStyle: 'italic' }}>{accent}</span></>}
    </h2>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════
   STAT PILL  (hero stat chips)
   Usage: <StatPill emoji="🎯" value="60+" label="Active Missions" />
          <StatPill emoji="⚡" value={xp} label={tier.rank} accent />
═══════════════════════════════════════════════════════════════════ */
export const StatPill = ({ emoji, value, label, accent = false }) => (
  <div style={{
    background: accent ? 'rgba(244,124,32,0.18)' : 'rgba(255,255,255,0.07)',
    border: `1px solid ${accent ? 'rgba(244,124,32,0.35)' : 'rgba(255,255,255,0.11)'}`,
    borderRadius: 14, padding: '10px 20px',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <span style={{ fontSize: 20 }}>{emoji}</span>
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontFamily: SF, fontWeight: 900, fontSize: 20, color: accent ? OR : '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   STEP CARD  (numbered how-to cards)
   Usage: <StepCard n="01" title="Pin Location" desc="…" />
═══════════════════════════════════════════════════════════════════ */
export const StepCard = ({ n, title, desc, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }} transition={{ delay }}
    style={{
      display: 'flex', gap: 16, alignItems: 'flex-start',
      padding: '18px 20px', borderRadius: 16, background: '#fff',
      border: '2px solid #f0ebe3', cursor: 'default',
      transition: 'transform 0.2s, box-shadow 0.2s', fontFamily: FF,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.08)';
      e.currentTarget.querySelector('.snum').style.background = OR;
      e.currentTarget.querySelector('.snum').style.color = '#fff';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
      e.currentTarget.querySelector('.snum').style.background = BG;
      e.currentTarget.querySelector('.snum').style.color = OR;
    }}>
    <div className="snum" style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: BG, border: '2px solid rgba(244,124,32,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SF, fontWeight: 900, fontSize: 17, color: OR,
      transition: 'background 0.2s, color 0.2s',
    }}>{n}</div>
    <div>
      <h4 style={{ fontWeight: 800, fontSize: 15, color: '#0f1c2e', marginBottom: 5 }}>{title}</h4>
      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGE HERO SHELL
   Provides the dark gradient bg, dot-grid, glow orbs, GrassEdge.
   Children go inside the inner motion.div.
   Usage:
     <PageHeroShell>
       <h1>…</h1>
       <StatPill … />
       <button>CTA</button>
     </PageHeroShell>
═══════════════════════════════════════════════════════════════════ */
export const PageHeroShell = ({ badge, children }) => (
  <section style={{
    background: 'linear-gradient(155deg,#0a1f35 0%,#0f3054 55%,#0c2644 100%)',
    paddingTop: 80, position: 'relative', overflow: 'hidden',
    textAlign: 'center', fontFamily: FF,
  }}>
    {/* dot grid */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)',
      backgroundSize: '32px 32px',
    }} />
    {/* orange glow top-right */}
    <div style={{
      position: 'absolute', top: -100, right: -80, width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(244,124,32,0.13) 0%,transparent 70%)', pointerEvents: 'none',
    }} />
    {/* teal glow bottom-left */}
    <div style={{
      position: 'absolute', bottom: 100, left: -60, width: 300, height: 300, borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(20,184,166,0.10) 0%,transparent 70%)', pointerEvents: 'none',
    }} />

    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      style={{ position: 'relative', zIndex: 2, padding: '0 24px 64px' }}>

      {/* badge pill */}
      {badge && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(244,124,32,0.15)', border: '1.5px solid rgba(244,124,32,0.3)',
          borderRadius: 999, padding: '7px 18px', marginBottom: 22,
        }}>
          <Megaphone size={13} style={{ color: '#fb923c' }} />
          <span style={{ color: '#fb923c', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {badge}
          </span>
        </div>
      )}

      {children}
    </motion.div>

    <GrassEdge from="transparent" to={BG} />
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   STICKY TAB BAR
   Usage:
     <StickyTabBar
       tabs={[{ id:'board', label:'🎯 Mission Board' }, { id:'log', label:'📋 My Log' }]}
       active={activeTab}
       onChange={setActiveTab}
     />
═══════════════════════════════════════════════════════════════════ */
export const StickyTabBar = ({ tabs, active, onChange }) => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 30, background: BG,
    borderBottom: '1px solid #f0ebe3', display: 'flex', justifyContent: 'center',
    fontFamily: FF,
  }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{
          padding: '16px 28px', background: 'none', border: 'none', cursor: 'pointer',
          fontWeight: 800, fontSize: 14, fontFamily: FF,
          color: active === t.id ? OR : '#94a3b8',
          borderBottom: active === t.id ? `3px solid ${OR}` : '3px solid transparent',
          marginBottom: -1, transition: 'color 0.2s,border-color 0.2s',
        }}>
        {t.label}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   GUEST BANNER
   Usage:
     <GuestBanner
       message="Log in to register for missions and earn XP."
       onLogin={requireLogin}
     />
═══════════════════════════════════════════════════════════════════ */
export const GuestBanner = ({ message, onLogin }) => (
  <div style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 24px' }}>
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, background: NV,
        color: '#fff', padding: '14px 20px', borderRadius: 16, fontFamily: FF,
      }}>
      <Lock size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
      <p style={{ flex: 1, fontSize: 14, fontWeight: 600, margin: 0 }}>
        Browsing as guest.{' '}
        <span style={{ opacity: 0.6 }}>{message}</span>
      </p>
      <button onClick={onLogin}
        style={{
          background: OR, color: '#fff', border: 'none', borderRadius: 10,
          padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          fontFamily: FF, flexShrink: 0,
        }}>
        Log In
      </button>
    </motion.div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   HOW-TO SECTION
   Reusable 2-col layout: steps list left, image right.
   Usage:
     <HowToSection
       label="Get Involved"
       title="How to"
       accent="file a complaint"
       steps={[{ n:'01', t:'…', d:'…' }]}
       image="https://…"
       badge={{ emoji:'⚡', value:'+10', label:'XP per report' }}
     />
═══════════════════════════════════════════════════════════════════ */
export const HowToSection = ({ label, title, accent, steps, image, imageAlt = 'Photo', badge, bg = BG }) => (
  <section style={{ background: bg, padding: '80px 24px', fontFamily: FF }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 60, gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}
      className="lk-hg">
      <style>{`@media(max-width:900px){.lk-hg{grid-template-columns:1fr!important}}`}</style>

      <div>
        <SectionHeader label={label} title={title} accent={accent} style={{ marginBottom: 36 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {steps.map((s, i) => <StepCard key={i} n={s.n} title={s.t} desc={s.d} delay={i * 0.12} />)}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.55 }}
        style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 20, left: -20, right: 20, bottom: -20,
          border: '3px dashed rgba(244,124,32,0.22)', borderRadius: 24, zIndex: 0,
        }} />
        <div style={{ position: 'relative', zIndex: 1, borderRadius: 22, overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 18px 52px rgba(0,0,0,0.14)' }}>
          <img src={image} alt={imageAlt} style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,31,53,0.4) 0%,transparent 55%)' }} />
        </div>
        {badge && (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.4, type: 'spring' }}
            style={{
              position: 'absolute', bottom: -22, left: -22, zIndex: 10,
              background: NV, borderRadius: 16, padding: '12px 18px',
              boxShadow: '0 10px 28px rgba(15,44,74,0.32)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <span style={{ fontSize: 22 }}>{badge.emoji}</span>
            <div>
              <div style={{ fontFamily: SF, fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1 }}>{badge.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{badge.label}</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   IMPACT STATS SECTION
   Usage:
     <ImpactStatsSection
       title="Resolved"
       accent="till now"
       subtitle="Real numbers from Nagpur's civic system."
       stats={[{ e:'🗺️', v:'380+', l:'Issues Resolved', t:'Across all Vibhags', d:'…' }]}
     />
═══════════════════════════════════════════════════════════════════ */
export const ImpactStatsSection = ({ title, accent, subtitle, stats }) => (
  <>
    <WaveDown from={BG} to={NV} />
    <section style={{ background: NV, padding: '72px 24px', fontFamily: FF }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontFamily: SF, fontWeight: 900, color: '#fff', fontSize: 'clamp(28px,4vw,44px)', marginBottom: 8 }}>
            {title}{' '}
            <span style={{ color: '#fb923c', fontStyle: 'italic' }}>{accent}</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>{subtitle}</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 22 }}>
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 20,
                border: '1.5px solid rgba(255,255,255,0.09)', padding: '28px 26px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
              <span style={{ fontSize: 36 }}>{s.e}</span>
              <div style={{ fontFamily: SF, fontWeight: 900, fontSize: 38, color: '#fb923c', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
              <h4 style={{ fontWeight: 800, fontSize: 16, color: '#fff', margin: 0 }}>{s.t}</h4>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.75, margin: 0 }}>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    <WaveDown from={NV} to={BG} />
  </>
);

/* ═══════════════════════════════════════════════════════════════════
   CTA BANNER
   Usage:
     <CTABanner
       title="Your city. Your"
       accent="voice."
       subtitle="Every complaint you file…"
       ctaLabel="File a Complaint"
       onCta={handleCta}
       image="https://…"
       height={340}
     />
═══════════════════════════════════════════════════════════════════ */
export const CTABanner = ({ title, accent, subtitle, ctaLabel, onCta, image, height = 380 }) => (
  <section style={{ position: 'relative', overflow: 'hidden', fontFamily: FF }}>
    <img src={image} alt="Community"
      style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,rgba(10,31,53,0.9) 0%,rgba(10,31,53,0.65) 55%,rgba(244,124,32,0.25) 100%)' }} />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '0 24px', gap: 20,
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 style={{ fontFamily: SF, fontWeight: 900, color: '#fff', fontSize: 'clamp(24px,5vw,52px)', lineHeight: 1.15, marginBottom: 16 }}>
          {title}{' '}
          <span style={{ color: '#fb923c' }}>{accent}</span>
        </h2>
        {subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.8 }}>
            {subtitle}
          </p>
        )}
        <button onClick={onCta} className="ob pring"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 14, cursor: 'pointer', border: 'none',
            background: OR, color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: FF,
            boxShadow: '0 6px 20px rgba(244,124,32,0.4)',
          }}>
          {ctaLabel} <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   COMMUNITY STRIP
   Usage:
     <CommunityStrip
       title="Join our community group"
       subtitle="For your interest…"
       ctaLabel="Join Now"
       onCta={handleJoin}
     />
═══════════════════════════════════════════════════════════════════ */
export const CommunityStrip = ({ title, subtitle, ctaLabel, onCta }) => (
  <section style={{
    background: NV, padding: '36px 40px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 20, fontFamily: FF,
  }}>
    <div>
      <h3 style={{ fontFamily: SF, fontWeight: 900, color: '#fff', fontSize: 'clamp(18px,3vw,28px)', marginBottom: 4 }}>
        {title}
      </h3>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>{subtitle}</p>}
    </div>
    <button onClick={onCta} className="ob"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 26px', borderRadius: 12, cursor: 'pointer', border: 'none',
        background: OR, color: '#fff', fontWeight: 800, fontSize: 14,
        fontFamily: FF, whiteSpace: 'nowrap',
        boxShadow: '0 4px 16px rgba(244,124,32,0.35)',
      }}>
      {ctaLabel} <ArrowRight size={16} />
    </button>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   LOADING STATE
   Usage: <LoadingState message="Loading missions…" />
═══════════════════════════════════════════════════════════════════ */
export const LoadingState = ({ message = 'Loading…' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: '#94a3b8', fontFamily: FF }}>
    <Loader2 size={24} style={{ color: OR, animation: 'spin 1s linear infinite' }} />
    <span style={{ fontWeight: 700 }}>{message}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   EMPTY STATE
   Usage: <EmptyState icon={Flag} title="No missions yet" subtitle="Check back soon." />
═══════════════════════════════════════════════════════════════════ */
export const EmptyState = ({ icon: Icon = Flag, title, subtitle }) => (
  <div style={{
    textAlign: 'center', padding: '80px 24px', background: '#fff',
    borderRadius: 24, border: '2px dashed #f0ebe3', fontFamily: FF,
  }}>
    <Icon size={48} style={{ color: '#e2e8f0', margin: '0 auto 16px', display: 'block' }} />
    <p style={{ fontFamily: SF, fontWeight: 900, fontSize: 18, color: NV, marginBottom: 6 }}>{title}</p>
    {subtitle && <p style={{ color: '#94a3b8', fontSize: 14 }}>{subtitle}</p>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   LOCKED STATE  (login-gate for tab content)
   Usage:
     <LockedState
       title="Your mission log is private"
       subtitle="Log in to see your accepted missions."
       ctaLabel="Log In to View Log"
       onLogin={requireLogin}
     />
═══════════════════════════════════════════════════════════════════ */
export const LockedState = ({ title, subtitle, ctaLabel, onLogin }) => (
  <div style={{
    background: '#fff', borderRadius: 22, border: '2px dashed #f0ebe3',
    padding: '64px 24px', textAlign: 'center', fontFamily: FF,
  }}>
    <Lock size={40} style={{ color: '#e2e8f0', margin: '0 auto 16px', display: 'block' }} />
    <p style={{ fontFamily: SF, fontWeight: 900, fontSize: 20, color: NV, marginBottom: 6 }}>{title}</p>
    {subtitle && <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 320, margin: '0 auto 24px' }}>{subtitle}</p>}
    <button onClick={onLogin}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: NV, color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: FF,
      }}>
      {ctaLabel} <ArrowRight size={16} />
    </button>
  </div>
);
