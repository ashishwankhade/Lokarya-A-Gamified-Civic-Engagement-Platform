/**
 * AttendancePanel.jsx
 * Live attendance management for NGO:
 *  - Mission selector dropdown (uses /activities/my so ALL statuses appear)
 *  - QR code display + download
 *  - Live attendance table with GPS status + override
 *  - Manual absent checkbox selection before ending event
 *  - Auto-refresh every 15 s while event is live
 *  - End Event button → triggers point distribution
 *
 * Path: src/dashboards/ngo/AttendancePanel.jsx
 *
 * FIXES applied:
 *  [1] fontFamily typo fixed on "View QR Code" button
 *  [2] Mission list now calls /activities/my (all statuses) instead of /activities
 *  [3] Auto-refresh poll every 15 s while event is active
 *  [4] Manual absent-marking checkboxes; ids passed to end-event
 *  [5] DeleteModal already used createPortal — verified consistent across modals
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Users, CheckCircle2, XCircle, Clock,
  MapPin, Download, RefreshCw, ShieldCheck,
  AlertTriangle, Loader2, ChevronDown,
  Flag, Wifi, WifiOff,
} from 'lucide-react';
import api        from '../../api/axios';
import { toast }  from 'react-toastify';
import { createPortal } from 'react-dom';

const NV = '#0f2c4a';
const G  = '#059669';
const OR = '#F47C20';

/* ── QR MODAL ────────────────────────────────────────────────────────────── */
const QrModal = ({ qrData, onClose, onRefresh, activityTitle }) => {
  const handleDownload = () => {
    const a    = document.createElement('a');
    a.href     = qrData.dataUrl;
    a.download = `qr-${activityTitle?.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)' }}
        onClick={onClose}/>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 24,
          padding: '32px 28px', width: '100%', maxWidth: 400, textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)', fontFamily: "'DM Sans',sans-serif" }}>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(to right, ${G}, #34d399)`, borderRadius: '24px 24px 0 0' }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: 'center', marginBottom: 6 }}>
          <QrCode size={22} style={{ color: G }}/>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
            fontSize: 20, color: NV }}>Event QR Code</h3>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          Display this at the venue. Volunteers scan to mark attendance.
        </p>

        <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16,
          border: '2px solid #e2e8f0', marginBottom: 16, display: 'inline-block' }}>
          <img src={qrData.dataUrl} alt="QR Code"
            style={{ width: 240, height: 240, display: 'block', borderRadius: 8 }}/>
        </div>

        <div style={{ background: qrData.isActive ? '#ecfdf5' : '#fee2e2',
          borderRadius: 12, padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          {qrData.isActive
            ? <CheckCircle2 size={14} style={{ color: G }}/>
            : <XCircle size={14} style={{ color: '#dc2626' }}/>}
          <span style={{ fontSize: 12, fontWeight: 800,
            color: qrData.isActive ? G : '#dc2626' }}>
            {qrData.isActive
              ? `Active · Expires ${new Date(qrData.expiresAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}`
              : 'QR Expired'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onRefresh}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '11px', borderRadius: 12, border: '2px solid #e2e8f0',
              background: '#fff', color: '#475569', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <RefreshCw size={14}/> Regenerate
          </button>
          <button onClick={handleDownload}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '11px', borderRadius: 12, border: 'none',
              background: NV, color: '#fff', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Download size={14}/> Download PNG
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

/* ── END EVENT CONFIRM MODAL ─────────────────────────────────────────────── */
const EndEventModal = ({ mission, onConfirm, onCancel, loading, absentCount }) => (
  createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)' }} onClick={onCancel}/>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 22,
          padding: 32, maxWidth: 400, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff0e0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Flag size={32} style={{ color: OR }}/>
        </div>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22,
          color: NV, marginBottom: 10 }}>End Event?</h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.75, marginBottom: 8 }}>
          Ending "<strong>{mission?.title}</strong>" will:
          <br/>① Expire the QR code permanently
          <br/>② Mark unscanned volunteers as absent
          <br/>③ Auto-credit XP to all present volunteers
        </p>
        {absentCount > 0 && (
          <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a',
            borderRadius: 10, padding: '8px 14px', marginBottom: 16, fontSize: 13,
            color: '#92400e', fontWeight: 700 }}>
            {absentCount} volunteer{absentCount > 1 ? 's' : ''} manually marked absent.
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontWeight: 800, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none',
              background: OR, color: '#fff', fontWeight: 800, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Ending…' : '🏁 End Event'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
);

/* ── ATTENDANCE ROW ──────────────────────────────────────────────────────── */
const AttendeeRow = ({ attendee, onOverride, overriding, manualAbsent, onToggleAbsent, isEnded }) => {
  const { user, scannedAt, gpsVerified, gpsOverride: overridden,
    gpsDistanceMeters, finalStatus, pointsCredited, totalPoints } = attendee;

  const name     = user?.name  || 'Unknown';
  const avatar   = user?.avatar;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const gpsFailed = scannedAt && !gpsVerified && !overridden;
  const gpsOk    = scannedAt && (gpsVerified || overridden);

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ borderBottom: '1px solid #f1f5f9',
        background: manualAbsent ? '#fffbeb' : 'transparent' }}>

      {/* manual absent checkbox — only shown before event ends */}
      {!isEnded && (
        <td style={{ padding: '14px 16px', textAlign: 'center', width: 40 }}>
          <input
            type="checkbox"
            checked={manualAbsent}
            onChange={() => onToggleAbsent(user?._id)}
            title="Mark as absent"
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#dc2626' }}
          />
        </td>
      )}

      {/* avatar + name */}
      <td style={{ padding: '14px 16px', minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: G, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden' }}>
            {avatar
              ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{initials}</span>}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: NV }}>{name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.email || ''}</div>
          </div>
        </div>
      </td>

      {/* scan status */}
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        {scannedAt ? (
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#ecfdf5', color: G, borderRadius: 999,
              padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
              <CheckCircle2 size={11}/> Scanned
            </span>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
              {new Date(scannedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
            </div>
          </div>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#f1f5f9', color: '#64748b', borderRadius: 999,
            padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
            <Clock size={11}/> Not yet
          </span>
        )}
      </td>

      {/* GPS status */}
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        {!scannedAt ? (
          <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
        ) : gpsOk ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: overridden ? '#eff6ff' : '#ecfdf5',
            color: overridden ? '#2563eb' : G,
            borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
            {overridden ? <ShieldCheck size={11}/> : <Wifi size={11}/>}
            {overridden ? 'Override' : `${Math.round(gpsDistanceMeters || 0)}m`}
          </span>
        ) : gpsFailed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#fef3c7', color: '#92400e',
              borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
              <WifiOff size={11}/> {Math.round(gpsDistanceMeters || 0)}m away
            </span>
            {!isEnded && (
              <button onClick={() => onOverride(user?._id)} disabled={overriding}
                style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 800,
                  fontFamily: "'DM Sans',sans-serif", opacity: overriding ? 0.6 : 1 }}>
                {overriding ? '…' : '✓ Override'}
              </button>
            )}
          </div>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>No GPS</span>
        )}
      </td>

      {/* final status */}
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        {manualAbsent && !isEnded ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fee2e2', color: '#dc2626', borderRadius: 999,
            padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
            <XCircle size={11}/> Marked Absent
          </span>
        ) : finalStatus === 'present' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#ecfdf5', color: G, borderRadius: 999,
            padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
            <CheckCircle2 size={11}/> Present
          </span>
        ) : finalStatus === 'absent' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fee2e2', color: '#dc2626', borderRadius: 999,
            padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
            <XCircle size={11}/> Absent
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fef3c7', color: '#92400e', borderRadius: 999,
            padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
            <Clock size={11}/> Pending
          </span>
        )}
      </td>

      {/* XP */}
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        {pointsCredited ? (
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
            fontSize: 18, color: OR }}>+{totalPoints}</span>
        ) : (
          <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
        )}
      </td>
    </motion.tr>
  );
};

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const AttendancePanel = ({ defaultMissionId, onBack }) => {
  const [missions,        setMissions]        = useState([]);
  const [selectedId,      setSelectedId]      = useState(defaultMissionId || '');
  const [attendanceData,  setAttendanceData]  = useState(null);
  const [qrData,          setQrData]          = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [qrLoading,       setQrLoading]       = useState(false);
  const [showQr,          setShowQr]          = useState(false);
  const [showEndModal,    setShowEndModal]     = useState(false);
  const [ending,          setEnding]          = useState(false);
  const [overridingId,    setOverridingId]    = useState(null);
  // FIX [4]: manual absent set — user IDs the NGO has ticked before ending
  const [manualAbsentIds, setManualAbsentIds] = useState(new Set());

  const isEnded = ['ended', 'completed'].includes(attendanceData?.activity?.status);

  /* ── FIX [2]: load mission list from /activities/my ─────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        let data;
        try {
          const res = await api.get('/activities/my');
          data = res.data;
        } catch (err) {
          if (err.response?.status === 404) {
            const res = await api.get('/activities');
            data = res.data;
          } else throw err;
        }
        setMissions(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
    };
    load();
  }, []);

  /* load attendance when selection changes */
  const loadAttendance = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setAttendanceData(null);
    setManualAbsentIds(new Set()); // reset manual absent on mission change
    try {
      const { data } = await api.get(`/activities/${id}/attendance`);
      setAttendanceData(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load attendance');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (selectedId) loadAttendance(selectedId); }, [selectedId, loadAttendance]);

  /* ── FIX [3]: auto-refresh every 15 s while event is live ───────────── */
  const pollRef = useRef(null);
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedId || isEnded) return;
    pollRef.current = setInterval(() => {
      loadAttendance(selectedId);
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [selectedId, isEnded, loadAttendance]);

  /* load QR */
  const loadQr = async () => {
    if (!selectedId) return;
    setQrLoading(true);
    try {
      const { data } = await api.get(`/activities/${selectedId}/qr`);
      setQrData(data);
      setShowQr(true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'QR not available yet');
    } finally { setQrLoading(false); }
  };

  /* regenerate QR */
  const handleRegenQr = async () => {
    try {
      await api.post(`/activities/${selectedId}/regenerate-qr`);
      toast.success('QR regenerated!');
      loadQr();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to regenerate QR');
    }
  };

  /* GPS override */
  const handleOverride = async (userId) => {
    setOverridingId(userId);
    try {
      await api.patch(`/activities/${selectedId}/gps-override`, { userId });
      toast.success('GPS override applied!');
      loadAttendance(selectedId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Override failed');
    } finally { setOverridingId(null); }
  };

  /* FIX [4]: toggle manual absent */
  const toggleManualAbsent = (userId) => {
    if (!userId) return;
    setManualAbsentIds(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  /* end event — FIX [4]: pass manualAbsentIds */
  const handleEndEvent = async () => {
    setEnding(true);
    try {
      const { data } = await api.post(`/activities/${selectedId}/end-event`, {
        absentUserIds: [...manualAbsentIds],
      });
      toast.success(`Event ended! ${data.pointsDistributed} volunteers credited XP.`);
      setShowEndModal(false);
      setManualAbsentIds(new Set());
      loadAttendance(selectedId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to end event');
    } finally { setEnding(false); }
  };

  const selectedMission = missions.find(m => m._id === selectedId);
  const att          = attendanceData?.attendance || [];
  const presentCount = att.filter(a => a.finalStatus === 'present').length;
  const pendingCount = att.filter(a => a.finalStatus === 'pending').length;
  const absentCount  = att.filter(a => a.finalStatus === 'absent').length;
  const gpsIssues    = att.filter(a => a.scannedAt && !a.gpsVerified && !a.gpsOverride).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* QR Modal */}
      <AnimatePresence>
        {showQr && qrData && (
          <QrModal
            qrData={qrData}
            activityTitle={selectedMission?.title}
            onClose={() => setShowQr(false)}
            onRefresh={handleRegenQr}
          />
        )}
      </AnimatePresence>

      {/* End Event Modal */}
      <AnimatePresence>
        {showEndModal && (
          <EndEventModal
            mission={selectedMission}
            onConfirm={handleEndEvent}
            onCancel={() => setShowEndModal(false)}
            loading={ending}
            absentCount={manualAbsentIds.size}
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
            fontSize: 24, color: NV, marginBottom: 4 }}>Attendance & QR</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Select a mission to view live attendance and manage the QR code.
            {!isEnded && selectedId && (
              <span style={{ marginLeft: 8, color: G, fontWeight: 700, fontSize: 12 }}>
                ● Auto-refreshing every 15 s
              </span>
            )}
          </p>
        </div>

        {selectedId && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* FIX [1]: fontFamily typo corrected */}
            <button onClick={loadQr} disabled={qrLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: NV, color: '#fff', fontWeight: 800, fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                opacity: qrLoading ? 0.7 : 1 }}>
              {qrLoading ? <Loader2 size={15} className="animate-spin"/> : <QrCode size={15}/>}
              View QR Code
            </button>
            <button onClick={() => loadAttendance(selectedId)}
              style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                border: '2px solid #e2e8f0', background: '#fff',
                color: '#475569', fontWeight: 800, fontSize: 13,
                fontFamily: "'DM Sans',sans-serif" }}>
              <RefreshCw size={14}/> Refresh
            </button>
            {!isEnded && att.length > 0 && (
              <button onClick={() => setShowEndModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: OR, color: '#fff', fontWeight: 800, fontSize: 13,
                  fontFamily: "'DM Sans',sans-serif",
                  boxShadow: '0 4px 14px rgba(244,124,32,0.35)' }}>
                <Flag size={14}/> End Event
                {manualAbsentIds.size > 0 && (
                  <span style={{ background: '#fff', color: OR, borderRadius: 999,
                    fontSize: 10, fontWeight: 900, padding: '1px 6px', marginLeft: 2 }}>
                    {manualAbsentIds.size} absent
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MISSION SELECTOR ────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 18, border: '2px solid #f0ebe3',
        padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <ChevronDown size={16} style={{ position: 'absolute', right: 13,
            top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}/>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ width: '100%', padding: '12px 36px 12px 16px',
              borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14,
              fontFamily: "'DM Sans',sans-serif", color: NV,
              appearance: 'none', background: '#fff', cursor: 'pointer', outline: 'none' }}>
            <option value="">— Select a mission —</option>
            {missions.map(m => (
              <option key={m._id} value={m._id}>
                {m.title} ({m.adminStatus === 'pending_approval' ? 'Pending' : m.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      {attendanceData && (
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14 }}>
          {[
            { label: 'Registered', val: att.length,    icon: Users,        color: NV,        bg: '#f1f5f9' },
            { label: 'Present',    val: presentCount,  icon: CheckCircle2, color: G,         bg: '#ecfdf5' },
            { label: 'Pending',    val: pendingCount,  icon: Clock,        color: '#92400e', bg: '#fef3c7' },
            { label: 'Absent',     val: absentCount,   icon: XCircle,      color: '#dc2626', bg: '#fee2e2' },
            { label: 'GPS Issues', val: gpsIssues,     icon: AlertTriangle,color: OR,        bg: '#fff0e0' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14,
              border: '2px solid #f0ebe3', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={18} style={{ color: s.color }}/>
              </div>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                  fontSize: 22, color: NV, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ENDED BANNER ────────────────────────────────────────────────── */}
      {isEnded && (
        <div style={{ background: '#f0fdf4', border: '2px solid #a7f3d0',
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} style={{ color: G }}/>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#15803d' }}>
            Event ended — QR expired. XP has been distributed to all present volunteers.
          </span>
        </div>
      )}

      {/* ── GPS ISSUES BANNER ─────────────────────────────────────────────── */}
      {gpsIssues > 0 && !isEnded && (
        <div style={{ background: '#fff0e0', border: '2px solid #fde8c8',
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} style={{ color: OR }}/>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
            {gpsIssues} volunteer{gpsIssues > 1 ? 's' : ''} had GPS failures.
            Use the <strong>Override</strong> button in the table to manually confirm them.
          </span>
        </div>
      )}

      {/* ── MANUAL ABSENT HINT ───────────────────────────────────────────── */}
      {!isEnded && att.length > 0 && (
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0',
          borderRadius: 12, padding: '10px 16px', fontSize: 12, color: '#64748b' }}>
          Tick the checkbox next to any volunteer to manually mark them absent before ending the event.
        </div>
      )}

      {/* ── ATTENDANCE TABLE ─────────────────────────────────────────────── */}
      {!selectedId ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff',
          borderRadius: 20, border: '2px dashed #e2e8f0' }}>
          <QrCode size={48} style={{ color: '#e2e8f0', margin: '0 auto 16px' }}/>
          <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: 16 }}>
            Select a mission above to view attendance
          </p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '60px 0', color: '#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" style={{ color: G }}/>
          <span style={{ fontWeight: 700 }}>Loading attendance…</span>
        </div>
      ) : att.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff',
          borderRadius: 20, border: '2px dashed #e2e8f0' }}>
          <Users size={40} style={{ color: '#e2e8f0', margin: '0 auto 16px' }}/>
          <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: 16 }}>
            No volunteers registered yet
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f0ebe3' }}>
                  {/* checkbox col header */}
                  {!isEnded && (
                    <th style={{ padding: '13px 16px', width: 40,
                      fontSize: 11, fontWeight: 800, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      fontFamily: "'DM Sans',sans-serif" }}>
                      Absent
                    </th>
                  )}
                  {['Volunteer', 'QR Scan', 'GPS Status', 'Final Status', 'XP'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'center',
                      fontSize: 11, fontWeight: 800, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      fontFamily: "'DM Sans',sans-serif",
                      ...(h === 'Volunteer' ? { textAlign: 'left' } : {}) }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {att.map((a, i) => (
                  <AttendeeRow
                    key={a.user?._id || i}
                    attendee={a}
                    onOverride={handleOverride}
                    overriding={overridingId === a.user?._id}
                    manualAbsent={manualAbsentIds.has(a.user?._id)}
                    onToggleAbsent={toggleManualAbsent}
                    isEnded={isEnded}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePanel;