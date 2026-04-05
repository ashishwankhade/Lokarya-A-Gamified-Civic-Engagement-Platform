/**
 * MissionManager.jsx
 * Full CRUD list of NGO's own missions.
 *
 * Path: src/dashboards/ngo/MissionManager.jsx
 *
 * FIXES applied:
 *  [1] Uses useMyMissions hook → correct endpoint, all statuses visible
 *  [2] DeleteModal wrapped with createPortal (prevents overflow:hidden clipping)
 *  [3] Uses shared StatusChip component
 *  [4] AttendeeRow key uses user._id instead of array index
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Pencil, Trash2, QrCode, Users,
  CalendarDays, MapPin, Zap, Search,
  AlertTriangle, Loader2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api          from '../../api/axios';
import { toast }    from 'react-toastify';
import useMyMissions from '../../hooks/useMyMissions';   // FIX [1]
import StatusChip    from '../../components/StatusChip'; // FIX [3]

const NV = '#0f2c4a';
const G  = '#059669';
const OR = '#F47C20';

/* ── CAT COLORS ─────────────────────────────────────────────────────────── */
const CAT = {
  Environment:       { c: '#059669', bg: '#ecfdf5', e: '🌱' },
  Education:         { c: '#2563eb', bg: '#dbeafe', e: '📚' },
  Healthcare:        { c: '#dc2626', bg: '#fee2e2', e: '❤️'  },
  Social:            { c: '#7c3aed', bg: '#ede9fe', e: '🤝' },
  'Animal Welfare':  { c: '#d97706', bg: '#fef3c7', e: '🐾' },
  Sanitation:        { c: '#0891b2', bg: '#e0f2fe', e: '🧹' },
  'Disaster Relief': { c: '#ea580c', bg: '#ffedd5', e: '🚨' },
};

/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────────────
   FIX [2]: uses createPortal to escape parent overflow:hidden
─────────────────────────────────────────────────────────────────────────── */
const DeleteModal = ({ mission, onConfirm, onCancel, loading }) => createPortal(
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)' }}
      onClick={onCancel}/>
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 22,
        padding: 32, width: '100%', maxWidth: 380, textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <AlertTriangle size={32} style={{ color: '#dc2626' }}/>
      </div>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22,
        color: NV, marginBottom: 10 }}>Delete Mission?</h3>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
        "<strong>{mission?.title}</strong>" will be permanently deleted. This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid #e2e8f0',
            background: '#fff', color: '#64748b', fontWeight: 800, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif" }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none',
            background: '#dc2626', color: '#fff', fontWeight: 800, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </div>,
  document.body
);

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const MissionManager = ({ onEdit, onOpenAttendance, onGoToCreate }) => {
  // FIX [1]: useMyMissions handles endpoint + filtering correctly
  const { missions, loading, reload } = useMyMissions();

  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/activities/${toDelete._id}`);
      toast.success('Mission deleted.');
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  /* filter + search */
  const displayed = missions.filter(m => {
    const key = m.adminStatus === 'rejected'                              ? 'rejected'
      : (m.adminStatus === 'pending_approval' || m.status === 'draft')   ? 'pending'
      : m.status === 'completed'                                          ? 'completed'
      : 'open';
    if (filter !== 'all' && key !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const FILTERS = [
    { id: 'all',       label: 'All' },
    { id: 'open',      label: 'Open' },
    { id: 'pending',   label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected',  label: 'Rejected' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
            fontSize: 24, color: NV, marginBottom: 4 }}>My Missions</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {missions.length} mission{missions.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={onGoToCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: G, color: '#fff', fontWeight: 800, fontSize: 14,
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: '0 4px 14px rgba(5,150,105,0.3)' }}>
          <PlusCircle size={16}/> New Mission
        </button>
      </div>

      {/* search + filter bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search missions…"
            style={{ width: '100%', padding: '11px 14px 11px 38px',
              borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14,
              fontFamily: "'DM Sans',sans-serif", outline: 'none',
              background: '#fff', color: NV }}/>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                border: filter === f.id ? 'none' : '2px solid #e2e8f0',
                background: filter === f.id ? NV : '#fff',
                color: filter === f.id ? '#fff' : '#64748b',
                transition: 'all 0.2s' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '60px 0', color: '#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" style={{ color: G }}/>
          <span style={{ fontWeight: 700 }}>Loading missions…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px',
          background: '#fff', borderRadius: 20, border: '2px dashed #e2e8f0' }}>
          <ListIcon />
          <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: 16, marginTop: 16 }}>
            {search ? 'No missions match your search.' : 'No missions here yet.'}
          </p>
          {!search && (
            <button onClick={onGoToCreate}
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: G, color: '#fff', fontWeight: 800, fontSize: 14,
                fontFamily: "'DM Sans',sans-serif" }}>
              <PlusCircle size={15}/> Create Mission
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence>
            {displayed.map((m, i) => {
              const cat      = CAT[m.category] || { c: '#64748b', bg: '#f1f5f9', e: '📋' };
              const regCount = m.attendance?.filter(a => a.registrationStatus === 'registered').length
                || m.participants?.length || 0;
              const maxP = m.maxParticipants || 1;
              const pct  = Math.min(100, Math.round((regCount / maxP) * 100));
              const isOpen = m.adminStatus === 'approved' && m.status === 'open';

              return (
                <motion.div key={m._id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }}
                  style={{ background: '#fff', borderRadius: 18,
                    border: '2px solid #f0ebe3',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

                  <div style={{ display: 'flex', gap: 0 }}>
                    {/* left color strip */}
                    <div style={{ width: 5, background: cat.c, flexShrink: 0 }}/>

                    {/* banner thumbnail */}
                    <div style={{ width: 110, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={m.banner || 'https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=300'}
                        alt={m.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                    </div>

                    {/* content */}
                    <div style={{ flex: 1, padding: '16px 20px', minWidth: 0,
                      display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ background: cat.bg, color: cat.c, borderRadius: 999,
                              fontSize: 10, fontWeight: 800, padding: '3px 8px',
                              textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {cat.e} {m.category}
                            </span>
                            {/* FIX [3]: shared StatusChip */}
                            <StatusChip status={m.status} adminStatus={m.adminStatus}/>
                          </div>
                          <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700,
                            fontSize: 17, color: NV, lineHeight: 1.3,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            maxWidth: 380 }}>
                            {m.title}
                          </h3>
                        </div>

                        {/* action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          {isOpen && (
                            <button onClick={() => onOpenAttendance(m._id)}
                              title="View Attendance & QR"
                              style={{ padding: '8px 14px', borderRadius: 10, border: 'none',
                                cursor: 'pointer', background: '#f0fdf4', color: G,
                                fontWeight: 800, fontSize: 12, display: 'flex',
                                alignItems: 'center', gap: 6,
                                fontFamily: "'DM Sans',sans-serif" }}>
                              <QrCode size={14}/> Attendance
                            </button>
                          )}
                          <button onClick={() => onEdit(m._id)}
                            title="Edit Mission"
                            style={{ padding: '8px 12px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', background: '#eff6ff', color: '#2563eb',
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontWeight: 800, fontSize: 12,
                              fontFamily: "'DM Sans',sans-serif" }}>
                            <Pencil size={14}/> Edit
                          </button>
                          <button onClick={() => setToDelete(m)}
                            title="Delete Mission"
                            style={{ padding: '8px 12px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', background: '#fee2e2', color: '#dc2626',
                              display: 'flex', alignItems: 'center',
                              fontFamily: "'DM Sans',sans-serif" }}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>

                      {/* meta row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                        {[
                          { I: CalendarDays, t: new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                          { I: MapPin,       t: m.location?.name || 'Nagpur' },
                          { I: Zap,          t: `+${m.pointsReward} XP` },
                        ].map(({ I, t }, idx) => (
                          <span key={idx} style={{ display: 'flex', alignItems: 'center',
                            gap: 5, color: '#94a3b8', fontSize: 12 }}>
                            <I size={12} style={{ color: OR }}/>{t}
                          </span>
                        ))}
                      </div>

                      {/* volunteers progress */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={11} style={{ color: G }}/>{regCount}/{maxP} registered
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 999 }}>
                          <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`,
                            background: `linear-gradient(to right, ${G}, #34d399)`,
                            transition: 'width 0.5s' }}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete modal — FIX [2]: createPortal */}
      <AnimatePresence>
        {toDelete && (
          <DeleteModal
            mission={toDelete}
            onConfirm={handleDelete}
            onCancel={() => setToDelete(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ListIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto' }}>
    <rect width="48" height="48" rx="14" fill="#f1f5f9"/>
    <rect x="13" y="15" width="22" height="3" rx="1.5" fill="#cbd5e1"/>
    <rect x="13" y="22" width="16" height="3" rx="1.5" fill="#cbd5e1"/>
    <rect x="13" y="29" width="19" height="3" rx="1.5" fill="#cbd5e1"/>
  </svg>
);

export default MissionManager;