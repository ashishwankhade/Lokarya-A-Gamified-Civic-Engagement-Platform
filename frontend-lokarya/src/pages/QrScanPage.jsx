/**
 * QrScanPage.jsx — Steps 4+5 of QR Attendance Flow
 * POST /api/activities/scan-qr  { payload, userLat, userLng }
 *
 * FIX 1: extractPayload() — handles both raw JWT string and JSON-wrapped payload
 * FIX 2: willReadFrequently canvas context — removes browser warning
 * FIX 3: console.log of decoded QR and sent body for easy debugging
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, ScanLine, MapPin, CheckCircle, AlertTriangle,
  XCircle, Loader2, Camera, CameraOff, Zap, ArrowRight,
  RotateCcw, ShieldCheck, Navigation, Clock, Lock,
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

/* ── GPS helper ─────────────────────────────────────────────────── */
const getGpsPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 30000, enableHighAccuracy: true }
    );
  });

/* ── FIX 1: Extract the correct payload the backend expects ────────
   The QR might encode:
     A) A raw JWT string  → send as-is
     B) JSON { payload: "<jwt>", activityId: "..." } → unwrap .payload
   Backend scanQr expects: verifyQrPayload(payload) where payload is
   whatever generateQrData() stored in activity.qr.payload.
─────────────────────────────────────────────────────────────────── */
const extractPayload = (raw) => {
  if (!raw) return null;
  const str = raw.trim();
  try {
    const parsed = JSON.parse(str);
    // If JSON has a "payload" key, that's the inner JWT — unwrap it
    if (typeof parsed.payload === 'string') return parsed.payload;
    // Otherwise the JSON string itself is the payload
    return str;
  } catch {
    // Not JSON — it's a raw string (JWT or token) — send as-is
    return str;
  }
};

/* ── Result configs ─────────────────────────────────────────────── */
const RESULT_CONFIGS = {
  success_gps: {
    bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle, iconColor: '#16a34a',
    title: 'Attendance Verified! ✅',
    subtitle: 'GPS confirmed you at the venue. Points will be credited when the NGO closes the event.',
  },
  success_nogps: {
    bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle, iconColor: '#16a34a',
    title: 'QR Scanned! ✅',
    subtitle: 'GPS was unavailable. The organiser may verify your attendance manually.',
  },
  gps_mismatch: {
    bg: '#fff7ed', border: '#fed7aa', icon: AlertTriangle, iconColor: '#ea580c',
    title: 'GPS Mismatch ⚠️',
    subtitle: 'You appear to be outside the venue radius. The NGO organiser has been notified and can manually confirm you.',
  },
  already_scanned: {
    bg: '#eff6ff', border: '#bfdbfe', icon: Clock, iconColor: '#2563eb',
    title: 'Already Scanned',
    subtitle: 'You have already recorded your attendance for this mission.',
  },
  not_registered: {
    bg: '#fee2e2', border: '#fecaca', icon: Lock, iconColor: '#dc2626',
    title: 'Not Registered',
    subtitle: 'You are not registered for this mission. Please register first from the Mission Board.',
  },
  error: {
    bg: '#fee2e2', border: '#fecaca', icon: XCircle, iconColor: '#dc2626',
    title: 'Scan Failed',
    subtitle: 'Something went wrong. Please try again or contact the organiser.',
  },
};

const ResultCard = ({ result, onRetry }) => {
  const cfg  = RESULT_CONFIGS[result.type] || RESULT_CONFIGS.error;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
      style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 24, padding: '32px 28px', textAlign: 'center', fontFamily: "'DM Sans',sans-serif", maxWidth: 420, margin: '0 auto' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 4px 20px ${cfg.border}` }}>
        <Icon size={36} style={{ color: cfg.iconColor }} />
      </div>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, color: '#0f1c2e', marginBottom: 10 }}>{result.title || cfg.title}</h3>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>{result.subtitle || cfg.subtitle}</p>
      {result.distance != null && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, padding: '8px 16px', border: `1.5px solid ${cfg.border}`, marginBottom: 20 }}>
          <Navigation size={13} style={{ color: cfg.iconColor }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
            {Math.round(result.distance)}m from venue{result.radius && ` (radius: ${result.radius}m)`}
          </span>
        </div>
      )}
      {result.type === 'success_gps' && result.pointsPending && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', marginBottom: 20, border: '2px dashed #fde8c8' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Potential Reward</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Zap size={20} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 28, color: '#0f1c2e' }}>+{result.pointsPending} XP</span>
          </div>
        </div>
      )}
      {(result.type === 'error' || result.type === 'gps_mismatch') && onRetry && (
        <button onClick={onRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#0f2c4a', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
          <RotateCcw size={15} /> Try Again
        </button>
      )}
    </motion.div>
  );
};

const CameraViewfinder = ({ videoRef, canvasRef, scanning }) => (
  <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '1 / 1', maxWidth: 380, margin: '0 auto' }}>
    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    <canvas ref={canvasRef} style={{ display: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {[
        { top: '18%',    left: '18%',  borderTop: '3px solid #F47C20', borderLeft:    '3px solid #F47C20' },
        { top: '18%',    right: '18%', borderTop: '3px solid #F47C20', borderRight:   '3px solid #F47C20' },
        { bottom: '18%', left: '18%',  borderBottom: '3px solid #F47C20', borderLeft: '3px solid #F47C20' },
        { bottom: '18%', right: '18%', borderBottom: '3px solid #F47C20', borderRight:'3px solid #F47C20' },
      ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 32, height: 32, borderRadius: 4, ...s }} />)}
      {scanning && (
        <motion.div
          animate={{ y: [-60, 60, -60] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '64%', height: 2, background: 'linear-gradient(to right, transparent, #F47C20, transparent)', borderRadius: 1 }}
        />
      )}
    </div>
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <ScanLine size={13} style={{ color: scanning ? '#fb923c' : '#94a3b8' }} />
      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{scanning ? 'Scanning…' : 'Initialising camera…'}</span>
    </div>
  </div>
);

const GpsIndicator = ({ gpsState }) => {
  const states = {
    requesting: { color: '#d97706', bg: '#fef3c7', label: 'Requesting GPS…', icon: Navigation },
    granted:    { color: '#059669', bg: '#ecfdf5', label: 'GPS Ready',        icon: MapPin    },
    denied:     { color: '#dc2626', bg: '#fee2e2', label: 'GPS Unavailable',  icon: MapPin    },
  };
  const s = states[gpsState] || states.requesting;
  const Icon = s.icon;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: s.bg, borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: s.color }}>
      <Icon size={12} /> {s.label}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
const QrScanPage = () => {
  const { isLoggedIn } = useAuth();

  const [phase,         setPhase]     = useState('idle');
  const [gpsState,      setGpsState]  = useState('requesting');
  const [gpsCoords,     setGpsCoords] = useState(null);
  const [cameraErr,     setCameraErr] = useState(null);
  const [manualPayload, setManual]    = useState('');
  const [useManual,     setUseManual] = useState(false);
  const [result,        setResult]    = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const jsQrRef   = useRef(null);

  useEffect(() => {
    import('jsqr').then(m => { jsQrRef.current = m.default || m; }).catch(() => setUseManual(true));
    return () => stopCamera();
  }, []);

  useEffect(() => {
    (async () => {
      const pos = await getGpsPosition();
      if (pos) { setGpsCoords(pos); setGpsState('granted'); }
      else      { setGpsState('denied'); }
    })();
  }, []);

  const stopCamera = () => {
    if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startScan = useCallback(async () => {
    if (useManual) { setPhase('scanning'); return; }
    setPhase('scanning');
    setCameraErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      setCameraErr(err.message || 'Camera access denied');
      setUseManual(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useManual]);

  const tick = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const jsQR   = jsQrRef.current;
    if (!video || !canvas || !jsQR || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.height = video.videoHeight;
    canvas.width  = video.videoWidth;
    // FIX 2: willReadFrequently suppresses the getImageData browser warning
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) {
      stopCamera();
      console.log('[QrScan] jsQR raw decode:', code.data); // FIX 3: debug log
      submitScan(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsCoords]);

  const submitScan = async (rawScanned) => {
    setPhase('submitting');

    // FIX 1: extract correct payload string
    const payload = extractPayload(rawScanned);
    console.log('[QrScan] extracted payload to send:', payload);

    if (!payload) {
      setResult({ type: 'error', subtitle: 'Could not read QR code content. Please try again.' });
      setPhase('result');
      return;
    }

    try {
      const body = { payload };
      if (gpsCoords) { body.userLat = gpsCoords.lat; body.userLng = gpsCoords.lng; }

      console.log('[QrScan] POST body:', body); // FIX 3: debug log
      const { data } = await api.post('/activities/scan-qr', body);

      if (data.success) {
        setResult({ type: data.gpsVerified ? 'success_gps' : 'success_nogps', distance: data.distance, pointsPending: data.pointsPending });
      } else if (data.layer === 2) {
        setResult({ type: 'gps_mismatch', distance: data.distance, radius: data.radius });
      } else {
        setResult({ type: 'error', subtitle: data.message });
      }
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || '';
      console.error('[QrScan] error response:', status, err.response?.data); // FIX 3: debug log

      if (status === 409) {
        setResult({
          type: 'already_scanned',
          subtitle: err.response?.data?.scannedAt
            ? `Already scanned at ${new Date(err.response.data.scannedAt).toLocaleTimeString('en-IN')}.`
            : 'You have already recorded your attendance for this mission.',
        });
      } else if (status === 403 && message.toLowerCase().includes('not registered')) {
        setResult({ type: 'not_registered' });
      } else {
        setResult({ type: 'error', subtitle: message || 'Scan failed. Please try again.' });
      }
    } finally {
      setPhase('result');
    }
  };

  const handleManualSubmit = () => {
    if (!manualPayload.trim()) { toast.warn('Paste the QR code text first.'); return; }
    submitScan(manualPayload.trim());
  };

  const reset = () => { setPhase('idle'); setResult(null); setManual(''); stopCamera(); };

  if (!isLoggedIn) return (
    <div style={{ minHeight: '100vh', background: '#fffbf5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans',sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 360 }}>
        <Lock size={48} style={{ color: '#e2e8f0', margin: '0 auto 20px' }} />
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 26, color: '#0f1c2e', marginBottom: 10 }}>Login Required</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>You must be logged in to scan a QR code and record your attendance.</p>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#0f2c4a', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          Log In to Continue <ArrowRight size={16} />
        </a>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a1f35 0%,#0f3054 40%,#0c2644 100%)', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,0,900&family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800;9..40,900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '28px 24px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(244,124,32,0.15)', border: '1.5px solid rgba(244,124,32,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 14 }}>
          <ScanLine size={12} style={{ color: '#fb923c' }} />
          <span style={{ color: '#fb923c', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>QR Attendance</span>
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, color: '#fff', fontSize: 'clamp(28px,6vw,44px)', lineHeight: 1.1, marginBottom: 8 }}>Scan to Check In</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>Point your camera at the NGO's QR code to verify attendance.</p>
        <GpsIndicator gpsState={gpsState} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 48px' }}>
        <AnimatePresence mode="wait">

          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 28, marginBottom: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(244,124,32,0.15)', border: '2px solid rgba(244,124,32,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Camera size={32} style={{ color: '#fb923c' }} />
                </div>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 8 }}>Use Camera</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>Allow camera access to scan the QR code displayed at the venue.</p>
                {cameraErr && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, textAlign: 'left' }}>
                    <CameraOff size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: '#fca5a5', fontSize: 12, lineHeight: 1.6 }}>{cameraErr}</span>
                  </div>
                )}
                <button onClick={startScan}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F47C20,#f59e0b)', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 24px rgba(244,124,32,0.4)' }}>
                  <Camera size={17} /> Start Scanning
                </button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 24px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Or enter code manually</p>
                <textarea value={manualPayload} onChange={e => setManual(e.target.value)} placeholder="Paste QR payload text here…" rows={3}
                  style={{ width: '100%', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, padding: '10px 14px', fontFamily: "'DM Sans',sans-serif", resize: 'none', outline: 'none', marginBottom: 12 }} />
                <button onClick={handleManualSubmit}
                  style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                  Submit Manually
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'scanning' && !useManual && (
            <motion.div key="scanning" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 420 }}>
              <CameraViewfinder videoRef={videoRef} canvasRef={canvasRef} scanning />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 16 }}>Hold the QR code steady inside the frame.</p>
              <button onClick={reset} style={{ display: 'block', margin: '14px auto 0', padding: '10px 22px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
            </motion.div>
          )}

          {phase === 'submitting' && (
            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
              <Loader2 size={52} style={{ color: '#F47C20', margin: '0 auto 20px' }} className="animate-spin" />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 700 }}>Verifying attendance…</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 }}>{gpsCoords ? 'Checking GPS proximity…' : 'GPS unavailable, submitting QR only…'}</p>
            </motion.div>
          )}

          {phase === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 420 }}>
              <ResultCard result={result} onRetry={reset} />
              {(result.type === 'success_gps' || result.type === 'success_nogps') && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <a href="/activities" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    Back to Missions <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {phase === 'idle' && (
        <div style={{ position: 'relative', zIndex: 2, padding: '0 24px 40px' }}>
          <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: ShieldCheck, label: 'Secure JWT-verified QR' },
              { icon: MapPin,      label: 'GPS proximity check'    },
              { icon: Zap,         label: 'Instant XP credit'      },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: '6px 14px' }}>
                <Icon size={12} style={{ color: '#fb923c' }} />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QrScanPage;
