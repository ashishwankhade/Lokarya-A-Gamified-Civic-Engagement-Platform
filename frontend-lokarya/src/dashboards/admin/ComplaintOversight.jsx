/**
 * ComplaintOversight.jsx
 * Path: src/dashboards/admin/ComplaintOversight.jsx
 *
 * Admin view of ALL complaints across the platform.
 * Actions:
 *  - Filter by status / vibhag / search
 *  - Force any status (PATCH /api/admin/complaints/:id/force-status)
 *  - Force resolve awards complaint_resolved XP to citizen (handled server-side)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Loader2, Flag, CheckCircle2, AlertCircle,
  ChevronDown, User, RefreshCw, Zap,
} from 'lucide-react';
import api       from '../../api/axios';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

const NV = '#0f2c4a';
const OR = '#F47C20';
const G  = '#059669';
const V  = '#7c3aed';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:          { color: '#dc2626', bg: '#fef2f2', label: 'Pending'          },
  under_review:     { color: '#d97706', bg: '#fffbeb', label: 'Under Review'     },
  officer_assigned: { color: '#2563eb', bg: '#eff6ff', label: 'Officer Assigned' },
  worker_assigned:  { color: V,         bg: '#f5f3ff', label: 'Worker Assigned'  },
  in_progress:      { color: V,         bg: '#f5f3ff', label: 'In Progress'      },
  resolved:         { color: G,         bg: '#ecfdf5', label: 'Resolved'         },
  closed:           { color: '#64748b', bg: '#f8fafc', label: 'Closed'           },
  escalated:        { color: '#dc2626', bg: '#fef2f2', label: 'Escalated'        },
  rejected:         { color: '#64748b', bg: '#f1f5f9', label: 'Rejected'         },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const VIBHAG_OPTIONS = [
  'Dharampeth','Dhantoli','Nehru Nagar','Gandhi Nagar',
  'Hanuman Nagar','Mangalwari','Ashi Nagar','Satranjipura',
  'Lakadganj','East Nagpur','West Nagpur','South Nagpur','North Nagpur','Other',
];

const StatusChip = ({ status }) => {
  const s = STATUS_CONFIG[status] || { color: '#64748b', bg: '#f1f5f9', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999,
      padding: '3px 10px', fontSize: 11, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

// ── Force Status Modal ────────────────────────────────────────────────────────
const ForceStatusModal = ({ complaint, onClose, onDone }) => {
  const [status,  setStatus]  = useState(complaint.status);
  const [note,    setNote]    = useState('');
  const [busy,    setBusy]    = useState(false);

  const isResolve = status === 'resolved';

  const submit = async () => {
    if (status === complaint.status) { toast.error('Select a different status.'); return; }
    setBusy(true);
    try {
      await api.patch(`/admin/complaints/${complaint._id}/force-status`, { status, note });
      toast.success(
        isResolve
          ? `✅ Complaint resolved. +XP awarded to ${complaint.user?.name || 'citizen'}.`
          : `Status updated to "${STATUS_CONFIG[status]?.label || status}".`
      );
      onDone();
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed.'); }
    finally     { setBusy(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)' }}
        onClick={() => !busy && onClose()} />

      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 22,
          padding: 28, maxWidth: 480, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: "'DM Sans',sans-serif" }}>

        <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
          fontSize: 20, color: NV, marginBottom: 4 }}>
          Force Status
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          {complaint.ticketId || `#${complaint._id?.slice(-6).toUpperCase()}`}
          {' · '}{complaint.category} · {complaint.user?.name || 'Unknown'}
        </p>

        {/* Status grid */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
            New Status
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {ALL_STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s];
              const active = status === s;
              return (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: '9px 6px', borderRadius: 10, cursor: 'pointer',
                    border: active ? `2px solid ${cfg.color}` : '2px solid #f0ebe3',
                    background: active ? cfg.bg : '#f8fafc',
                    color: active ? cfg.color : '#64748b',
                    fontWeight: 800, fontSize: 11, fontFamily: "'DM Sans',sans-serif",
                    transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* XP notice when resolving */}
        {isResolve && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 12,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={14} fill={G} style={{ color: G, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
              Resolving will award <strong>complaint_resolved XP</strong> to {complaint.user?.name || 'the citizen'}.
            </span>
          </motion.div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Admin Note (optional)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="Reason for this status change…"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '2px solid #e2e8f0', fontSize: 13, fontFamily: "'DM Sans',sans-serif",
              color: NV, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = OR}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={busy}
            style={{ flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
              border: '2px solid #e2e8f0', background: '#fff', color: '#64748b',
              fontWeight: 800, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy || status === complaint.status}
            style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none',
              background: status === complaint.status ? '#f1f5f9' : OR,
              color: status === complaint.status ? '#94a3b8' : '#fff',
              fontWeight: 800, fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans',sans-serif", opacity: busy ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {busy ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {busy ? 'Updating…' : 'Apply Status'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
const ComplaintOversight = () => {
  const [complaints, setComplaints] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [vibhagF,    setVibhagF]    = useState('');
  const [forceTarget, setForceTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search)  params.set('search', search);
      if (statusF) params.set('status', statusF);
      if (vibhagF) params.set('vibhag', vibhagF);
      const { data } = await api.get(`/admin/complaints?${params}`);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { toast.error('Failed to load complaints'); }
    finally  { setLoading(false); }
  }, [page, search, statusF, vibhagF]);

  useEffect(() => { load(); },                    [load]);
  useEffect(() => { setPage(1); }, [search, statusF, vibhagF]);

  const inputStyle = {
    padding: '10px 14px', borderRadius: 11, border: '2px solid #e2e8f0',
    fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: NV,
    outline: 'none', background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* Force Status Modal */}
      <AnimatePresence>
        {forceTarget && (
          <ForceStatusModal
            complaint={forceTarget}
            onClose={() => setForceTarget(null)}
            onDone={load}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
          fontSize: 24, color: NV, margin: 0 }}>Complaint Oversight</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {total} complaints platform-wide · force-resolve awards XP to citizen
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ticket ID or title…"
            style={{ ...inputStyle, width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = OR}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <select value={statusF} onChange={e => setStatusF(e.target.value)}
            style={{ ...inputStyle, paddingRight: 32, appearance: 'none', cursor: 'pointer', minWidth: 160 }}
            onFocus={e => e.target.style.borderColor = OR}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}>
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>

        {/* Vibhag filter */}
        <div style={{ position: 'relative' }}>
          <select value={vibhagF} onChange={e => setVibhagF(e.target.value)}
            style={{ ...inputStyle, paddingRight: 32, appearance: 'none', cursor: 'pointer', minWidth: 160 }}
            onFocus={e => e.target.style.borderColor = OR}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}>
            <option value="">All Vibhags</option>
            {VIBHAG_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>

        {/* Refresh */}
        <button onClick={load}
          style={{ padding: '10px 14px', borderRadius: 11, border: '2px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontWeight: 700, fontSize: 13, color: '#64748b', fontFamily: "'DM Sans',sans-serif" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
        overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '60px 0', color: '#94a3b8' }}>
            <Loader2 size={22} style={{ color: V, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 700 }}>Loading complaints…</span>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Flag size={40} style={{ color: '#e2e8f0', margin: '0 auto 14px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 700 }}>No complaints found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f0ebe3' }}>
                  {['Ticket', 'Citizen', 'Category', 'Vibhag', 'Status', 'Filed', 'Action'].map(h => (
                    <th key={h} style={{ padding: '13px 16px',
                      textAlign: h === 'Ticket' || h === 'Citizen' ? 'left' : 'center',
                      fontSize: 11, fontWeight: 800, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, i) => (
                  <motion.tr key={c._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Ticket */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800,
                        fontSize: 12, color: NV }}>
                        {c.ticketId || `#${c._id?.slice(-6).toUpperCase()}`}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2,
                        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title || c.description?.slice(0, 40)}
                      </div>
                    </td>

                    {/* Citizen */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%',
                          background: '#f5f3ff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} style={{ color: V }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: NV }}>
                            {c.user?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.user?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                        {c.category}
                      </span>
                    </td>

                    {/* Vibhag */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {c.vibhag
                        ? <span style={{ background: '#ecfdf5', color: G, borderRadius: 999,
                            padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>{c.vibhag}</span>
                        : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <StatusChip status={c.status} />
                    </td>

                    {/* Filed */}
                    <td style={{ padding: '14px 16px', textAlign: 'center',
                      fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN',
                        { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button onClick={() => setForceTarget(c)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                          background: '#fff5ee', color: OR, fontWeight: 800, fontSize: 12,
                          fontFamily: "'DM Sans',sans-serif", transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fde8cc'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff5ee'}>
                        <RefreshCw size={12} /> Force
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
              background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: page === 1 ? '#cbd5e1' : '#475569',
              fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
            Page {page} of {pages}
          </span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
              background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: page === pages ? '#cbd5e1' : '#475569',
              fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplaintOversight;
