/**
 * NGOOverview.jsx
 * NGO dashboard home — stat cards, recent missions, quick actions.
 * Path: src/dashboards/ngo/NGOOverview.jsx
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ListChecks, Users, Zap, Clock, TrendingUp,
  PlusCircle, QrCode, ArrowRight, CheckCircle2,
  AlertCircle, CalendarDays, MapPin,
} from 'lucide-react';
import api from '../../api/axios';

/* ── palette ────────────────────────────────────────────────────────────── */
const G  = '#059669';   // emerald
const G2 = '#ecfdf5';
const NV = '#0f2c4a';
const OR = '#F47C20';

/* ── tiny helpers ────────────────────────────────────────────────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const Card = ({ children, style = {} }) => (
  <div style={{
    background: '#fff', borderRadius: 18,
    border: '2px solid #f0ebe3',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    padding: '24px 26px',
    fontFamily: "'DM Sans',sans-serif",
    ...style,
  }}>
    {children}
  </div>
);

const StatCard = ({ icon: Icon, label, value, sub, color, bg, delay }) => (
  <motion.div {...fade(delay)}>
    <Card style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: NV, lineHeight: 1,
          fontFamily: "'Fraunces',serif" }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </Card>
  </motion.div>
);

/* ── STATUS CHIP ─────────────────────────────────────────────────────────── */
const statusMeta = {
  open:             { label: 'Open',            bg: '#ecfdf5', color: '#059669' },
  draft:            { label: 'Pending Approval', bg: '#fef3c7', color: '#92400e' },
  pending_approval: { label: 'Pending Approval', bg: '#fef3c7', color: '#92400e' },
  ended:            { label: 'Ended',            bg: '#f1f5f9', color: '#475569' },
  completed:        { label: 'Completed',        bg: '#eff6ff', color: '#2563eb' },
  rejected:         { label: 'Rejected',         bg: '#fee2e2', color: '#b91c1c' },
};

const StatusChip = ({ status, adminStatus }) => {
  const key = adminStatus === 'rejected' ? 'rejected'
    : adminStatus === 'pending_approval' ? 'pending_approval'
    : status;
  const m = statusMeta[key] || statusMeta.open;
  return (
    <span style={{
      background: m.bg, color: m.color,
      fontSize: 10, fontWeight: 800, borderRadius: 999,
      padding: '3px 10px', letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>{m.label}</span>
  );
};

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const NGOOverview = ({ onGoToMissions, onGoToCreate, onOpenAttendance }) => {
  const [missions, setMissions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        /* fetch this NGO's own missions — we use getAllActivities but filter
           by ngo on backend; for now fetch all and slice for overview */
        const [own, pending] = await Promise.all([
          api.get('/activities').catch(() => ({ data: [] })),
          api.get('/activities/pending-approvals').catch(() => ({ data: [] })),
        ]);
        setMissions(Array.isArray(own.data) ? own.data : []);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  /* derive stats */
  const total       = missions.length;
  const openCount   = missions.filter(m => m.status === 'open').length;
  const volunteers  = missions.reduce((s, m) => s + (m.attendance?.length || m.participants?.length || 0), 0);
  const xpGiven     = missions.reduce((s, m) => s + (m.pointsReward || 0) * (m.volunteerCount || 0), 0);

  const recent = [...missions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const STATS = [
    { icon: ListChecks,  label: 'Total Missions',      value: total,     sub: 'All time',           color: G,      bg: G2,      delay: 0    },
    { icon: CalendarDays,label: 'Live / Open',          value: openCount, sub: 'Accepting volunteers',color: '#2563eb', bg: '#eff6ff', delay: 0.07 },
    { icon: Users,       label: 'Total Volunteers',     value: volunteers,sub: 'Registered across all', color: OR, bg: '#fff0e0', delay: 0.14 },
    { icon: Zap,         label: 'XP Distributed',       value: `${xpGiven}`,sub: 'Points given out',color: '#7c3aed', bg: '#f5f3ff', delay: 0.21 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── WELCOME BANNER ───────────────────────────────────────────────── */}
      <motion.div {...fade(0)}
        style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: `linear-gradient(135deg, ${NV} 0%, #0f3f6e 100%)`,
          padding: '28px 32px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
        }}>
        {/* dot texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px' }}/>
        {/* emerald glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(5,150,105,0.2) 0%,transparent 70%)',
          pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.35)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399' }}/>
            <span style={{ color: '#34d399', fontSize: 11, fontWeight: 800,
              letterSpacing: '0.1em', textTransform: 'uppercase' }}>NGO Dashboard</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, color: '#fff',
            fontSize: 'clamp(22px,3vw,34px)', lineHeight: 1.2, marginBottom: 8 }}>
            Welcome back 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, maxWidth: 420 }}>
            Your missions are making Nagpur better every day. Create a new mission or review today's attendance.
          </p>
        </div>

        {/* quick action buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button onClick={onGoToCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: G, color: '#fff', fontWeight: 800, fontSize: 13,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <PlusCircle size={16} /> New Mission
          </button>
          <button onClick={onGoToMissions}
            style={{ display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700,
              fontSize: 13, fontFamily: "'DM Sans',sans-serif",
              border: '1.5px solid rgba(255,255,255,0.2)',
              transition: 'background 0.2s' }}>
            <ListChecks size={16} /> View All
          </button>
        </div>
      </motion.div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {STATS.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── RECENT MISSIONS ──────────────────────────────────────────────── */}
      <motion.div {...fade(0.28)}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 20, color: NV }}>
              Recent Missions
            </h3>
            <button onClick={onGoToMissions}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: 'none', cursor: 'pointer', color: G, fontWeight: 800, fontSize: 13,
                fontFamily: "'DM Sans',sans-serif" }}>
              See all <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ListChecks size={40} style={{ color: '#e2e8f0', margin: '0 auto 12px' }}/>
              <p style={{ color: '#94a3b8', fontWeight: 700 }}>No missions yet.</p>
              <button onClick={onGoToCreate}
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: G, color: '#fff', fontWeight: 800, fontSize: 13,
                  fontFamily: "'DM Sans',sans-serif" }}>
                <PlusCircle size={15}/> Create your first mission
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recent.map((m, i) => {
                const count = m.attendance?.filter(a => a.registrationStatus === 'registered').length
                  || m.participants?.length || 0;
                return (
                  <motion.div key={m._id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* category color strip */}
                    <div style={{ width: 4, height: 42, borderRadius: 4, flexShrink: 0,
                      background: m.category === 'Environment' ? G
                        : m.category === 'Education' ? '#2563eb'
                        : m.category === 'Healthcare' ? '#dc2626'
                        : OR }}/>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: NV,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2,
                        display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} style={{ color: OR }}/>{m.location?.name || 'Nagpur'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={11} style={{ color: G }}/>{count} registered
                        </span>
                      </div>
                    </div>

                    <StatusChip status={m.status} adminStatus={m.adminStatus}/>

                    {/* QR button if approved + open */}
                    {m.adminStatus === 'approved' && m.status === 'open' && (
                      <button onClick={(e) => { e.stopPropagation(); onOpenAttendance(m._id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: '#f0fdf4', color: G, fontWeight: 800, fontSize: 12,
                          fontFamily: "'DM Sans',sans-serif" }}>
                        <QrCode size={13}/> QR
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── QUICK TIPS ───────────────────────────────────────────────────── */}
      <motion.div {...fade(0.35)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {[
            { icon: CheckCircle2, color: G,       bg: G2,       title: 'Admin Approval',    desc: 'All missions go to super-admin for review before going live. Usually within 24h.' },
            { icon: QrCode,       color: '#7c3aed', bg: '#f5f3ff', title: 'QR Auto-Generated', desc: 'Once approved, a signed QR is auto-created with GPS and expiry baked in.' },
            { icon: AlertCircle,  color: OR,        bg: '#fff0e0', title: 'GPS Override',      desc: "If a volunteer's GPS fails indoors, manually confirm them from the Attendance panel." },
            { icon: TrendingUp,   color: '#2563eb', bg: '#eff6ff', title: 'Bonus XP',          desc: 'Early bird, streak, and bring-a-friend bonuses are auto-calculated at event end.' },
          ].map((t, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16,
              border: '2px solid #f0ebe3', padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: t.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <t.icon size={20} style={{ color: t.color }}/>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: NV }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NGOOverview;
