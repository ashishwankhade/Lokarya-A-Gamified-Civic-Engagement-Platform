// src/dashboards/authority/ComplaintDetail.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Clock, Flame, Loader2,
  Wrench, X, AlertTriangle, Star,
  Image as ImageIcon, Camera, ShieldCheck, UserCheck,
} from 'lucide-react';
import api            from '../../api/axios';
import EnhancedMiniMap from './EnhancedMiniMap';
import PhotoCard       from './PhotoCard';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const imgUrl = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${BACKEND}/${raw.replace(/^\//, '')}`;
};

/* ─── reusable form primitives ─────────────────────────────────────────────── */
const Textarea = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ color: '#64748b', fontSize: 11, fontWeight: 700,
      display: 'block', marginBottom: 5 }}>{label}</label>
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={3}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 9,
        background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
        fontSize: 13, outline: 'none', resize: 'vertical',
        fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' }} />
  </div>
);

const InputField = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ color: '#64748b', fontSize: 11, fontWeight: 700,
      display: 'block', marginBottom: 4 }}>{label}</label>
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 9,
        background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
        fontSize: 13, outline: 'none',
        fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' }} />
  </div>
);

const SubmitBtn = ({ label, onClick, loading, color = '#2563eb', disabled }) => (
  <button
    onClick={onClick} disabled={loading || disabled}
    style={{ width: '100%', padding: '10px', borderRadius: 9,
      fontSize: 13, fontWeight: 800,
      background: disabled || loading ? '#f1f5f9' : color,
      color:      disabled || loading ? '#94a3b8' : '#fff',
      border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontFamily: "'DM Sans',sans-serif", transition: 'opacity 0.15s' }}>
    {loading && <Loader2 size={13} className="animate-spin" />}
    {label}
  </button>
);

/* ─── Portal Modal ─────────────────────────────────────────────────────────── */
const Modal = ({ title, onClose, children }) =>
  createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,0.45)', padding: 20,
        fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ position: 'relative', width: '100%', maxWidth: 460,
          borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0',
          padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: '#0f172a', fontWeight: 900, fontSize: 15 }}>{title}</h3>
          <button onClick={onClose}
            style={{ color: '#94a3b8', cursor: 'pointer', background: 'none',
              border: 'none', padding: 4, borderRadius: 6, lineHeight: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={17} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );

/* ─── Status / Timeline config — FIX: added worker_accepted everywhere ─────── */
const STEP_ICON = {
  pending:          Clock,
  officer_assigned: CheckCircle2,
  worker_assigned:  Wrench,
  worker_accepted:  Wrench,       // ✅ was missing
  in_progress:      Wrench,
  resolved:         CheckCircle2,
  closed:           CheckCircle2,
  escalated:        AlertTriangle,
};
const STEP_COLOR = {
  pending:          '#d97706',
  officer_assigned: '#0369a1',
  worker_assigned:  '#7c3aed',
  worker_accepted:  '#0284c7',    // ✅ was missing
  in_progress:      '#2563eb',
  resolved:         '#059669',
  closed:           '#64748b',
  escalated:        '#dc2626',
};
const STEP_BG = {
  pending:          '#fef3c7',
  officer_assigned: '#e0f2fe',
  worker_assigned:  '#ede9fe',
  worker_accepted:  '#e0f2fe',    // ✅ was missing
  in_progress:      '#dbeafe',
  resolved:         '#d1fae5',
  closed:           '#f1f5f9',
  escalated:        '#fee2e2',
};
// ✅ Single source of truth — STATUS_META also has worker_accepted
const STATUS_META = {
  pending:          { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  officer_assigned: { color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  worker_assigned:  { color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  worker_accepted:  { color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' }, // ✅ was missing
  in_progress:      { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
  resolved:         { color: '#059669', bg: '#d1fae5', border: '#a7f3d0' },
  closed:           { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  escalated:        { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
};

/* ─── TimelineStep ─────────────────────────────────────────────────────────── */
const TimelineStep = ({ step, isLast }) => {
  const Icon  = STEP_ICON[step.status]  || Clock;
  const color = STEP_COLOR[step.status] || '#d97706';
  const bg    = STEP_BG[step.status]    || '#fef3c7';
  const ts    = step.date || step.timestamp;
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 30, height: 30, borderRadius: 999, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
          <Icon size={13} style={{ color }} />
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 20,
            background: '#f1f5f9', margin: '4px 0' }} />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 18, paddingTop: 4 }}>
        <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
          {step.status.replace(/_/g, ' ')}
        </p>
        {step.message && (
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{step.message}</p>
        )}
        {ts && (
          <p style={{ color: '#94a3b8', fontSize: 10,
            fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>
            {new Date(ts).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── InfoTile ─────────────────────────────────────────────────────────────── */
const InfoTile = ({ label, value }) => (
  <div style={{ background: '#f8fafc', borderRadius: 10,
    padding: '10px 14px', border: '1px solid #f1f5f9' }}>
    <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 3 }}>{label}</p>
    <p style={{ color: '#0f172a', fontSize: 13, fontWeight: 700 }}>{value || '—'}</p>
  </div>
);

/* ─── ErrorBanner ───────────────────────────────────────────────────────────── */
const ErrorBanner = ({ msg }) => msg ? (
  <div style={{ padding: '9px 14px', borderRadius: 9, background: '#fef2f2',
    border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
    {msg}
  </div>
) : null;

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const ComplaintDetail = ({ complaintId, onBack }) => {
  const [c,           setC]           = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null); // 'officer' | 'worker' | 'resolve'
  const [workers,     setWorkers]     = useState([]);
  const [selWorker,   setSelWorker]   = useState('');
  const [resolveNote, setResolveNote] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  // Officer form state
  const [officerName,        setOfficerName]        = useState('');
  const [officerDesignation, setOfficerDesignation] = useState('');
  const [officerContact,     setOfficerContact]     = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/complaints/${complaintId}`)
      .then(({ data }) => setC(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [complaintId]);

  /* ── open officer modal ── */
  const openOfficerModal = () => {
    // Pre-fill if already assigned
    setOfficerName(c?.assignedOfficer?.name || '');
    setOfficerDesignation(c?.assignedOfficer?.designation || '');
    setOfficerContact(c?.assignedOfficer?.contact || '');
    setError('');
    setModal('officer');
  };

  /* ── assign officer ── */
  const assignOfficer = async () => {
    if (!officerName.trim()) { setError('Officer name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/complaints/${complaintId}/assign-officer`, {
        officerName:        officerName.trim(),
        officerDesignation: officerDesignation.trim() || 'Ward Officer',
        officerContact:     officerContact.trim(),
      });
      setModal(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to assign officer.');
    } finally { setSubmitting(false); }
  };

  /* ── open worker modal + fetch workers ── */
  const openWorkerModal = () => {
    setError('');
    api.get('/field-workers')
      .then(({ data }) => setWorkers(data))
      .catch(() => setWorkers([]));
    setSelWorker('');
    setModal('worker');
  };

  /* ── assign worker ── */
  const assignWorker = async () => {
    if (!selWorker) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/complaints/${complaintId}/assign-worker`, { workerId: selWorker });
      setModal(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to assign worker.');
    } finally { setSubmitting(false); }
  };

  /* ── resolve ── */
  const resolve = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/complaints/${complaintId}/resolve`, { resolutionNote: resolveNote });
      setModal(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to resolve complaint.');
    } finally { setSubmitting(false); }
  };

  /* ── close modal helper ── */
  const closeModal = () => { setModal(null); setError(''); };

  /* ── loading / not found states ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 300, gap: 10, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>
      <Loader2 size={20} className="animate-spin" style={{ color: '#2563eb' }} />
      <span>Loading complaint…</span>
    </div>
  );

  if (!c) return (
    <div style={{ textAlign: 'center', padding: 64, fontFamily: "'DM Sans',sans-serif" }}>
      <p style={{ color: '#94a3b8' }}>Complaint not found.</p>
      <button onClick={onBack}
        style={{ color: '#2563eb', marginTop: 12, cursor: 'pointer',
          background: 'none', border: 'none', fontSize: 13 }}>
        ← Go back
      </button>
    </div>
  );

  /* ── derived state ── */
  const sm = STATUS_META[c.status] || STATUS_META.pending;

  // ✅ Officer can be assigned/reassigned at pending, under_review states
  const canAssignOfficer = ['pending', 'under_review'].includes(c.status);
  // ✅ Worker can be assigned from pending, under_review, or after officer is assigned
  const canAssignWorker  = ['pending', 'under_review', 'officer_assigned'].includes(c.status);
  // ✅ Resolve allowed once worker has accepted or is in progress
  const canResolve       = ['worker_accepted', 'in_progress', 'worker_assigned'].includes(c.status);

  const citizenPhoto    = imgUrl(c.image);
  const resolutionPhoto = imgUrl(c.resolutionImage);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", maxWidth: 940 }}>

      {/* ── Back button ── */}
      <button onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', background: 'none', border: 'none', marginBottom: 20, padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
        <ArrowLeft size={15} /> Back to Queue
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Header card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20,
            border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: 18, marginBottom: 5 }}>
                  {c.title || `${c.category} Issue`}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                  {c.ticketId} · Filed {new Date(c.createdAt).toLocaleDateString('en-IN',
                    { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
                borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 800,
                whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                {c.status.replace(/_/g, ' ')}
              </span>
            </div>

            {c.description && (
              <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
                {c.description}
              </p>
            )}

            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
              <InfoTile label="Category" value={c.category} />
              <InfoTile label="Vibhag"   value={c.vibhag} />
              <InfoTile label="Priority" value={c.priority || 'Normal'} />
              <InfoTile label="SLA Deadline"
                value={c.slaDeadline
                  ? new Date(c.slaDeadline).toLocaleString('en-IN',
                      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—'} />
            </div>

            {/* Map */}
            {c.location?.lat && c.location?.lng && (
              <div style={{ marginTop: 16 }}>
                <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 8,
                  textTransform: 'uppercase', letterSpacing: '0.07em' }}>Location</p>
                <EnhancedMiniMap
                  lat={c.location.lat} lng={c.location.lng}
                  title={c.title} status={c.status} address={c.location.address} />
              </div>
            )}

            {c.slaBreached && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
                padding: '10px 14px', borderRadius: 10,
                background: '#fef2f2', border: '1px solid #fecaca' }}>
                <Flame size={14} style={{ color: '#dc2626' }} />
                <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                  SLA deadline breached — urgent action required
                </span>
              </div>
            )}
          </div>

          {/* Citizen evidence photo */}
          {citizenPhoto && (
            <PhotoCard
              src={citizenPhoto}
              label="Citizen's Evidence Photo"
              icon={Camera}
              accentColor="#d97706"
              accentBg="#fffbeb"
              accentBorder="#fde68a"
              badge="Filed with complaint"
            />
          )}

          {/* Resolution proof photo */}
          {resolutionPhoto && (
            <PhotoCard
              src={resolutionPhoto}
              label="Resolution Proof Photo"
              icon={ShieldCheck}
              accentColor="#059669"
              accentBg="#ecfdf5"
              accentBorder="#a7f3d0"
              badge="Uploaded by field worker"
            />
          )}

          {/* No photos placeholder */}
          {!citizenPhoto && !resolutionPhoto && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '28px 20px',
              border: '1px dashed #e2e8f0', textAlign: 'center' }}>
              <ImageIcon size={28} style={{ color: '#e2e8f0', margin: '0 auto 8px', display: 'block' }} />
              <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>No photos attached yet</p>
              <p style={{ color: '#cbd5e1', fontSize: 11, marginTop: 3 }}>
                Photos appear once the citizen uploads evidence or the worker uploads proof.
              </p>
            </div>
          )}

          {/* Citizen rating */}
          {c.citizenRating && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 18,
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>Citizen Rating</p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={18} style={{
                    color: s <= c.citizenRating ? '#f59e0b' : '#e2e8f0',
                    fill:  s <= c.citizenRating ? '#f59e0b' : 'none',
                  }} />
                ))}
                <span style={{ color: '#64748b', fontSize: 12, marginLeft: 6 }}>
                  {c.citizenRating}/5
                </span>
              </div>
              {c.ratingNote && (
                <p style={{ color: '#64748b', fontSize: 12 }}>{c.ratingNote}</p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20,
            border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 16,
              textTransform: 'uppercase', letterSpacing: '0.07em' }}>Timeline</p>
            {(c.timeline || []).length === 0
              ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No timeline entries yet.</p>
              : c.timeline.map((step, i) => (
                  <TimelineStep key={i} step={step} isLast={i === c.timeline.length - 1} />
                ))
            }
          </div>
        </div>

        {/* ════════════════ RIGHT COLUMN ════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ✅ Ward Officer card — assign or show assigned */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18,
            border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 12,
              textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ward Officer</p>

            {c.assignedOfficer?.name ? (
              <div style={{ marginBottom: canAssignOfficer ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                    background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 15 }}>
                    {c.assignedOfficer.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 13, margin: 0 }}>
                      {c.assignedOfficer.name}
                    </p>
                    <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>
                      {c.assignedOfficer.designation || 'Ward Officer'}
                    </p>
                    {c.assignedOfficer.contact && (
                      <p style={{ color: '#94a3b8', fontSize: 11, margin: 0,
                        fontFamily: "'JetBrains Mono',monospace" }}>
                        {c.assignedOfficer.contact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
                Not yet assigned
              </p>
            )}

            {/* ✅ Officer assign button — only at pending / under_review */}
            {canAssignOfficer && (
              <button onClick={openOfficerModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif", marginTop: c.assignedOfficer?.name ? 8 : 0 }}>
                <UserCheck size={13} />
                {c.assignedOfficer?.name ? 'Reassign Officer' : 'Assign Officer'}
              </button>
            )}
          </div>

          {/* ✅ Field Worker card — primary assignment card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18,
            border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 12,
              textTransform: 'uppercase', letterSpacing: '0.07em' }}>Field Worker</p>

            {c.assignedWorker ? (
              <div style={{ marginBottom: canAssignWorker ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                    background: 'linear-gradient(135deg,#10b981,#047857)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 15 }}>
                    {c.assignedWorker.name?.[0]?.toUpperCase() || 'W'}
                  </div>
                  <div>
                    <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 13, margin: 0 }}>
                      {c.assignedWorker.name}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: 0,
                      fontFamily: "'JetBrains Mono',monospace" }}>
                      {c.assignedWorker.employeeId}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: 0,
                      fontFamily: "'JetBrains Mono',monospace" }}>
                      {c.assignedWorker.phone}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
                Not yet assigned
              </p>
            )}

            {canAssignWorker && (
              <button onClick={openWorkerModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif", marginTop: c.assignedWorker ? 8 : 0 }}>
                <Wrench size={13} />
                {c.assignedWorker ? 'Reassign Worker' : 'Assign Worker'}
              </button>
            )}
          </div>

          {/* Resolve button */}
          {canResolve && (
            <button onClick={() => { setError(''); setModal('resolve'); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '11px', borderRadius: 12,
                background: '#059669', color: '#fff', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif",
                boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
              <CheckCircle2 size={15} /> Mark as Resolved
            </button>
          )}

          {/* Photo thumbnails sidebar summary */}
          {(citizenPhoto || resolutionPhoto) && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16,
              border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: '0.07em' }}>Photos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {citizenPhoto && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={citizenPhoto} alt="Evidence"
                      style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover',
                        border: '1.5px solid #fde68a', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Evidence photo
                      </p>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>By citizen</p>
                    </div>
                  </div>
                )}
                {resolutionPhoto && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={resolutionPhoto} alt="Resolution"
                      style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover',
                        border: '1.5px solid #a7f3d0', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Resolution proof
                      </p>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>By field worker</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}
      <AnimatePresence>

        {/* ✅ Officer assignment modal — was completely missing */}
        {modal === 'officer' && (
          <Modal title="Assign Ward Officer" onClose={closeModal}>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
              Assign a Ward Officer to oversee this complaint. They will be notified.
            </p>
            <ErrorBanner msg={error} />
            <InputField
              label="Officer Name *"
              value={officerName}
              onChange={setOfficerName}
              placeholder="e.g. Rajesh Kumar"
            />
            <InputField
              label="Designation"
              value={officerDesignation}
              onChange={setOfficerDesignation}
              placeholder="Ward Officer"
            />
            <InputField
              label="Contact Number"
              value={officerContact}
              onChange={setOfficerContact}
              placeholder="+91XXXXXXXXXX"
            />
            <SubmitBtn
              label="Assign Officer"
              onClick={assignOfficer}
              loading={submitting}
              disabled={!officerName.trim()}
              color="#2563eb"
            />
          </Modal>
        )}

        {/* Worker modal */}
        {modal === 'worker' && (
          <Modal title="Assign Field Worker" onClose={closeModal}>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
              Select a field worker to assign directly. A WhatsApp notification will be sent.
            </p>
            <ErrorBanner msg={error} />
            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 14,
              display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workers.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  No field workers found. Add workers in the Field Workers tab.
                </p>
              ) : workers.map(w => (
                <button key={w._id} onClick={() => setSelWorker(w._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: selWorker === w._id ? '#eff6ff' : '#f8fafc',
                    border: selWorker === w._id ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                    fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (selWorker !== w._id) e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { if (selWorker !== w._id) e.currentTarget.style.background = '#f8fafc'; }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                    background: selWorker === w._id
                      ? 'linear-gradient(135deg,#10b981,#047857)'
                      : 'linear-gradient(135deg,#94a3b8,#64748b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 14 }}>
                    {w.name?.[0]?.toUpperCase() || 'W'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 13, margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {w.name}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 10, margin: 0,
                      fontFamily: "'JetBrains Mono',monospace" }}>
                      {w.employeeId} · {w.phone} · {w.activeComplaints?.length || 0} active
                    </p>
                  </div>
                  {selWorker === w._id && (
                    <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
            <SubmitBtn
              label="Assign & Send WhatsApp"
              onClick={assignWorker}
              loading={submitting}
              disabled={!selWorker}
              color="#059669"
            />
          </Modal>
        )}

        {/* Resolve modal */}
        {modal === 'resolve' && (
          <Modal title="Mark as Resolved" onClose={closeModal}>
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 9,
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              color: '#047857', fontSize: 12, fontWeight: 700 }}>
              Citizen will receive a notification to rate the resolution.
            </div>
            <ErrorBanner msg={error} />
            <Textarea
              label="Resolution Note (optional)"
              value={resolveNote}
              onChange={setResolveNote}
              placeholder="Describe what was done…"
            />
            <SubmitBtn label="Confirm Resolved" onClick={resolve} loading={submitting} color="#059669" />
          </Modal>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ComplaintDetail;