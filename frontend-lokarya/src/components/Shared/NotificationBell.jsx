import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// ── Inject styles once at module level — never on re-render ──────────────────
if (typeof document !== 'undefined' && !document.getElementById('notif-bell-css')) {
  const s = document.createElement('style');
  s.id = 'notif-bell-css';
  s.textContent = `
    .notif-scroll::-webkit-scrollbar { width: 4px; }
    .notif-scroll::-webkit-scrollbar-track { background: transparent; }
    .notif-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }
    @keyframes bellShake {
      0%,100% { transform: rotate(0deg);   }
      20%     { transform: rotate(-12deg); }
      40%     { transform: rotate(12deg);  }
      60%     { transform: rotate(-8deg);  }
      80%     { transform: rotate(8deg);   }
    }
    @keyframes pingRing {
      0%   { transform: scale(1);   opacity: 0.8; }
      100% { transform: scale(1.8); opacity: 0;   }
    }
  `;
  document.head.appendChild(s);
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: { icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', dot: '#059669' },
  error:   { icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#dc2626' },
  warning: { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#d97706' },
  info:    { icon: Info,          color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb' },
};

// ── Relative time helper ──────────────────────────────────────────────────────
const relativeTime = (dateStr) => {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Hook: computes dropdown position dynamically ──────────────────────────────
// Desktop  → anchored right:0 (aligns with bell's right edge)
// Mobile   → centered on the viewport width
const useDropdownStyle = (bellRef) => {
  const [style, setStyle] = useState({ right: 0, width: 360, transformOrigin: 'top right' });

  const compute = useCallback(() => {
    if (!bellRef.current) return;

    const DROPDOWN_W = 360;
    const MOBILE_BP  = 640;
    const EDGE_PAD   = 12; // px gap from screen edges on mobile

    if (window.innerWidth <= MOBILE_BP) {
      // Center the dropdown on the screen.
      // Because the dropdown is position:absolute relative to the bell button,
      // we calculate how far left the bell's left edge is from the screen center,
      // then offset accordingly so the dropdown's center = screen center.
      const rect     = bellRef.current.getBoundingClientRect();
      const dropW    = Math.min(DROPDOWN_W, window.innerWidth - EDGE_PAD * 2);
      const screenCX = window.innerWidth / 2;
      // left offset from bell's left edge so dropdown center == screen center
      const leftPx   = screenCX - rect.left - dropW / 2;

      setStyle({
        left:            leftPx,
        right:           'auto',
        width:           dropW,
        transformOrigin: 'top center',
      });
    } else {
      setStyle({
        right:           0,
        left:            'auto',
        width:           DROPDOWN_W,
        transformOrigin: 'top right',
      });
    }
  }, [bellRef]);

  useEffect(() => {
    compute();                                           // run on mount
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [compute]);

  return style;
};

// ─────────────────────────────────────────────────────────────────────────────
const NotificationBell = () => {
  const { isLoggedIn } = useAuth();

  const [isOpen,        setIsOpen]        = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [prevUnread,    setPrevUnread]     = useState(0);
  const [pulse,         setPulse]          = useState(false);

  const dropdownRef   = useRef(null);
  const bellRef       = useRef(null);
  const dropdownStyle = useDropdownStyle(bellRef);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const { data } = await api.get('/notifications');
      const list  = Array.isArray(data.notifications) ? data.notifications : [];
      const count = typeof data.unreadCount === 'number'  ? data.unreadCount  : 0;
      setNotifications(list);
      if (count > prevUnread) setPulse(true);
      setUnreadCount(count);
      setPrevUnread(count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, prevUnread]);

  // ── Reset pulse ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 1000);
    return () => clearTimeout(t);
  }, [pulse]);

  // ── Mark single read ─────────────────────────────────────────────────────
  const markSingleAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  // ── Mark all read ────────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async (e) => {
    e.stopPropagation();
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, [unreadCount]);

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { setNotifications([]); setUnreadCount(0); return; }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchNotifications]);

  // ── Outside click ────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (!isLoggedIn) return null;

  const hasUnread = unreadCount > 0;

  return (
    <div
      ref={dropdownRef}
      style={{
        position:   'relative',
        flexShrink:  0,
        display:    'flex',
        alignItems: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Bell button ──────────────────────────────────────────────────── */}
      <motion.button
        ref={bellRef}
        onClick={() => setIsOpen(o => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label="Notifications"
        style={{
          position:       'relative',
          width:           40,
          height:          40,
          borderRadius:   '50%',
          border:          isOpen ? '2px solid #0f2c4a' : '2px solid transparent',
          background:      isOpen ? '#0f2c4a' : '#f1f5f9',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:          'pointer',
          transition:      'all 0.2s',
          outline:         'none',
          flexShrink:      0,
        }}
      >
        <Bell
          size={18}
          style={{
            color:      isOpen ? '#fff' : '#475569',
            transition: 'color 0.2s',
            animation:  pulse ? 'bellShake 0.5s ease' : 'none',
          }}
        />

        {/* Unread badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position:       'absolute',
                top:             -2,
                right:           -2,
                minWidth:        18,
                height:          18,
                borderRadius:   '999px',
                background:     '#F47C20',
                color:          '#fff',
                fontSize:        10,
                fontWeight:      800,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '0 4px',
                boxShadow:      '0 0 0 2px #fff',
                lineHeight:      1,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {pulse && (
          <span style={{
            position:     'absolute',
            inset:         0,
            borderRadius: '50%',
            border:        '2px solid #F47C20',
            animation:     'pingRing 0.8s ease-out forwards',
          }} />
        )}
      </motion.button>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1    }}
            exit={{    opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position:  'absolute',
              top:       'calc(100% + 10px)',
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(15,44,74,0.15), 0 4px 16px rgba(15,44,74,0.08)',
              border:    '1.5px solid #f0ebe3',
              overflow:  'hidden',
              zIndex:     9999,
              // ↓ position + width + transformOrigin all come from the hook
              ...dropdownStyle,
            }}
          >
            {/* Header */}
            <div style={{
              padding:        '14px 18px 12px',
              borderBottom:   '1.5px solid #f1f5f9',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              background:     'linear-gradient(135deg, #0f2c4a 0%, #164e63 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={15} style={{ color: '#F47C20' }} />
                <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Notifications</span>
                {hasUnread && (
                  <span style={{
                    background:   '#F47C20',
                    color:        '#fff',
                    borderRadius:  999,
                    fontSize:      10,
                    fontWeight:    800,
                    padding:      '1px 7px',
                    lineHeight:    1.6,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>

              {hasUnread && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:          4,
                    background:  'rgba(255,255,255,0.12)',
                    border:      '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    padding:     '5px 10px',
                    color:       '#fff',
                    fontSize:     11,
                    fontWeight:   700,
                    cursor:       'pointer',
                    fontFamily:  "'DM Sans', sans-serif",
                    transition:  'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="notif-scroll" style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                  <div style={{
                    width:          52,
                    height:         52,
                    borderRadius:   '50%',
                    background:     '#f8fafc',
                    border:         '2px dashed #e2e8f0',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    margin:         '0 auto 14px',
                  }}>
                    <Sparkles size={20} style={{ color: '#cbd5e1' }} />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#0f2c4a', marginBottom: 4 }}>All caught up!</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((note, i) => {
                  const cfg  = TYPE_CONFIG[note.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={note._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0  }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => !note.isRead && markSingleAsRead(note._id)}
                      style={{
                        display:      'flex',
                        gap:           12,
                        padding:      '13px 18px',
                        borderBottom: i < notifications.length - 1 ? '1px solid #f8fafc' : 'none',
                        background:   note.isRead ? 'transparent' : `${cfg.bg}80`,
                        cursor:       note.isRead ? 'default' : 'pointer',
                        transition:   'background 0.15s',
                        position:     'relative',
                      }}
                      onMouseEnter={e => { if (!note.isRead) e.currentTarget.style.background = cfg.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = note.isRead ? 'transparent' : `${cfg.bg}80`; }}
                    >
                      {/* Unread left bar */}
                      {!note.isRead && (
                        <div style={{
                          position:     'absolute',
                          left:          0,
                          top:           8,
                          bottom:        8,
                          width:         3,
                          borderRadius: '0 3px 3px 0',
                          background:   cfg.color,
                        }} />
                      )}

                      {/* Icon */}
                      <div style={{
                        width:          36,
                        height:         36,
                        borderRadius:   11,
                        background:     cfg.bg,
                        border:         `1.5px solid ${cfg.border}`,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:      0,
                        marginTop:       1,
                      }}>
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize:     13,
                          fontWeight:   note.isRead ? 400 : 700,
                          color:        note.isRead ? '#64748b' : '#0f2c4a',
                          lineHeight:   1.5,
                          marginBottom: 4,
                        }}>
                          {note.message}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.03em' }}>
                          {relativeTime(note.createdAt)}
                        </span>
                      </div>

                      {/* Unread dot */}
                      {!note.isRead && (
                        <div style={{
                          width:        7,
                          height:       7,
                          borderRadius: '50%',
                          background:   cfg.dot,
                          flexShrink:   0,
                          marginTop:    6,
                          boxShadow:    `0 0 0 2px ${cfg.bg}`,
                        }} />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding:    '10px 18px',
                borderTop:  '1.5px solid #f1f5f9',
                background: '#fafafa',
                textAlign:  'center',
              }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                  Showing last {notifications.length} notifications · Auto-refreshes every 60s
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;