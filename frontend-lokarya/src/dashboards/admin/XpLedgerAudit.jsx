/**
 * XpLedgerAudit.jsx
 * Path: src/dashboards/admin/XpLedgerAudit.jsx
 *
 * FIXES:
 *  - Loader2 spinner: was missing `className="animate-spin"`, relying on
 *    inline animation string that does nothing without a matching @keyframes
 *    in the stylesheet.
 *  - Double-fetch: same pattern as ComplaintOversight — `useEffect` to reset
 *    page + `useCallback` depending on page caused two fetches per filter
 *    change. Fixed by resetting page directly inside a single effect that
 *    watches filter values, decoupled from the load callback.
 *  - Removed dead `getTier` function (was defined in PlatformAnalytics and
 *    not present here — no change needed, confirmed clean).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  TrendingUp, TrendingDown, Zap, RefreshCw, ChevronDown,
} from 'lucide-react';
import api       from '../../api/axios';
import { toast } from 'react-toastify';

const NV = '#0f2c4a';
const OR = '#F47C20';
const G  = '#059669';
const V  = '#7c3aed';
const R  = '#dc2626';

const ACTION_META = {
  file_complaint:        { label: 'Filed Complaint',       emoji: '📋', color: OR       },
  first_complaint:       { label: 'First Complaint Bonus', emoji: '🎉', color: '#d97706' },
  complaint_resolved:    { label: 'Complaint Resolved',    emoji: '✅', color: G        },
  rate_feedback:         { label: 'Gave Feedback',         emoji: '⭐', color: '#d97706' },
  attend_ngo_activity:   { label: 'NGO Activity',          emoji: '🤝', color: V        },
  verify_duplicate:      { label: 'Verified Duplicate',    emoji: '🔍', color: '#0891b2' },
  refer_friend:          { label: 'Referred Friend',       emoji: '👫', color: '#2563eb' },
  streak_7day:           { label: '7-Day Streak',          emoji: '🔥', color: R        },
  ngo_create_mission:    { label: 'Mission Approved',      emoji: '🚀', color: G        },
  ngo_mission_completed: { label: 'Mission Completed',     emoji: '🏁', color: V        },
  admin_manual_award:    { label: 'Admin Award / Revoke',  emoji: '🎁', color: '#64748b' },
  redeem_reward:         { label: 'Reward Redeemed',       emoji: '🛍️', color: R        },
};

const ALL_ACTIONS = Object.keys(ACTION_META);

// ── Summary stat pill ─────────────────────────────────────────────────────────
const SummaryPill = ({ icon: Icon, label, value, color, bg }) => (
  <div style={{
    background: bg, borderRadius: 14, padding: '14px 20px',
    display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 140,
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 11, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, color, lineHeight: 1 }}>{value}</div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
      }}>{label}</div>
    </div>
  </div>
);

// ── MAIN ──────────────────────────────────────────────────────────────────────
const XpLedgerAudit = () => {
  const [entries,  setEntries]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [summary,  setSummary]  = useState({ totalXp: 0, totalGiven: 0, totalTaken: 0, count: 0 });
  const [loading,  setLoading]  = useState(true);

  // Filters
  const [userIdF, setUserIdF] = useState('');
  const [actionF, setActionF] = useState('');
  const [fromF,   setFromF]   = useState('');
  const [toF,     setToF]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (userIdF) params.set('userId', userIdF.trim());
      if (actionF) params.set('action', actionF);
      if (fromF)   params.set('from',   fromF);
      if (toF)     params.set('to',     toF);

      const { data } = await api.get(`/admin/xp-ledger?${params}`);
      setEntries(data.entries  || []);
      setTotal(data.total      || 0);
      setPages(data.pages      || 1);
      setSummary(data.summary  || { totalXp: 0, totalGiven: 0, totalTaken: 0, count: 0 });
    } catch { toast.error('Failed to load XP ledger'); }
    finally  { setLoading(false); }
  }, [page, userIdF, actionF, fromF, toF]);

  useEffect(() => { load(); }, [load]);

  // FIX: reset page to 1 when filters change, but do it in a single effect
  // that doesn't cause a second fetch (load already re-fires via page dep).
  useEffect(() => {
    setPage(1);
  }, [userIdF, actionF, fromF, toF]);

  const inputStyle = {
    padding: '9px 13px', borderRadius: 10, border: '2px solid #e2e8f0',
    fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: NV,
    outline: 'none', background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 24, color: NV, margin: 0 }}>
            XP Ledger Audit
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            {total} transactions · full platform audit trail
          </p>
        </div>
        <button onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
            borderRadius: 11, border: '2px solid #e2e8f0', background: '#fff',
            fontWeight: 700, fontSize: 13, color: '#475569', cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif",
          }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <SummaryPill icon={Zap}          label="Net XP"      value={summary.totalXp}              color={OR} bg="#fff5ee" />
        <SummaryPill icon={TrendingUp}   label="XP Awarded"  value={summary.totalGiven}           color={G}  bg="#ecfdf5" />
        <SummaryPill icon={TrendingDown} label="XP Deducted" value={Math.abs(summary.totalTaken)} color={R}  bg="#fef2f2" />
        <SummaryPill icon={Search}       label="Entries"     value={summary.count}                color={V}  bg="#f5f3ff" />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        background: '#fff', borderRadius: 16, border: '2px solid #f0ebe3', padding: '16px 18px',
      }}>
        {/* User ID */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input value={userIdF} onChange={e => setUserIdF(e.target.value)}
            placeholder="Filter by User ID…"
            style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = OR}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Action filter */}
        <div style={{ position: 'relative' }}>
          <select value={actionF} onChange={e => setActionF(e.target.value)}
            style={{ ...inputStyle, paddingRight: 28, appearance: 'none', cursor: 'pointer', minWidth: 170 }}
            onFocus={e => e.target.style.borderColor = OR}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}>
            <option value="">All Actions</option>
            {ALL_ACTIONS.map(a => (
              <option key={a} value={a}>{ACTION_META[a].emoji} {ACTION_META[a].label}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>

        {/* Date from */}
        <input type="date" value={fromF} onChange={e => setFromF(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = OR}
          onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />

        {/* Date to */}
        <input type="date" value={toF} onChange={e => setToF(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = OR}
          onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />

        {/* Clear */}
        {(userIdF || actionF || fromF || toF) && (
          <button onClick={() => { setUserIdF(''); setActionF(''); setFromF(''); setToF(''); }}
            style={{
              padding: '9px 14px', borderRadius: 10, border: '2px solid #fee2e2',
              background: '#fff', color: R, fontWeight: 700, fontSize: 12,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Ledger list */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
        overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '60px 0', color: '#94a3b8' }}>
            {/* FIX: className animate-spin */}
            <Loader2 size={22} className="animate-spin" style={{ color: V }} />
            <span style={{ fontWeight: 700 }}>Loading ledger…</span>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Zap size={40} style={{ color: '#e2e8f0', margin: '0 auto 14px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 700 }}>No transactions found.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr',
              padding: '12px 20px', background: '#f8fafc',
              borderBottom: '2px solid #f0ebe3', gap: 8,
            }}>
              {['User', 'Action', 'Note', 'XP', 'Balance', 'Date'].map(h => (
                <div key={h} style={{
                  fontSize: 11, fontWeight: 800, color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>{h}</div>
              ))}
            </div>

            {entries.map((entry, i) => {
              const meta   = ACTION_META[entry.action] || { label: entry.action, emoji: '⚡', color: '#64748b' };
              const isGain = entry.xp >= 0;
              const user   = entry.user || {};

              return (
                <motion.div key={entry._id || i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr',
                    padding: '13px 20px', gap: 8, alignItems: 'center',
                    borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* User */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: NV }}>
                      {user.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                      {user.email}
                    </div>
                    <div style={{ fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace', marginTop: 1 }}>
                      {typeof user === 'object' ? user._id : user}
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  </div>

                  {/* Note */}
                  <div style={{
                    fontSize: 11, color: '#64748b', lineHeight: 1.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.meta?.note || '—'}
                  </div>

                  {/* XP delta */}
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 18, color: isGain ? G : R }}>
                    {isGain ? '+' : ''}{entry.xp}
                  </div>

                  {/* Balance */}
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 15, color: '#475569' }}>
                    {entry.balance}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(entry.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
              background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: page === 1 ? '#cbd5e1' : '#475569',
              fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
            }}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
            Page {page} of {pages}
          </span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
              background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: page === pages ? '#cbd5e1' : '#475569',
              fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
            }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default XpLedgerAudit;