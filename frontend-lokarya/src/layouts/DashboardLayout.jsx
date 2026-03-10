// src/layouts/DashboardLayout.jsx
// Pure inline styles — no Tailwind dependency, no className conflicts
// Light theme: white sidebar, #f8fafc page background, blue accent

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/Shared/NotificationBell'; // ← ADDED

// ── per-role config ───────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  authority: {
    accent:       '#2563eb',
    accentLight:  '#eff6ff',
    accentBorder: '#bfdbfe',
    accentText:   '#1d4ed8',
    label:        'Authority',
    sub:          'Command Centre',
    avatarGrad:   'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    badgeBg:      '#dbeafe',
    badgeText:    '#1e40af',
  },
  ngo: {
    accent:       '#059669',
    accentLight:  '#ecfdf5',
    accentBorder: '#a7f3d0',
    accentText:   '#047857',
    label:        'NGO',
    sub:          'Mission Control',
    avatarGrad:   'linear-gradient(135deg,#10b981,#059669)',
    badgeBg:      '#d1fae5',
    badgeText:    '#065f46',
  },
  super_admin: {
    accent:       '#7c3aed',
    accentLight:  '#f5f3ff',
    accentBorder: '#ddd6fe',
    accentText:   '#6d28d9',
    label:        'Super Admin',
    sub:          'Platform Overview',
    avatarGrad:   'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    badgeBg:      '#ede9fe',
    badgeText:    '#5b21b6',
  },
};

// ── responsive hook ───────────────────────────────────────────────────────────
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
};

// ── sidebar content ───────────────────────────────────────────────────────────
const SidebarContent = ({ cfg, navItems, activePage, onNavigate, user, onLogout, closeMobile }) => (
  <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

    {/* Brand */}
    <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid #f1f5f9',
      display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:cfg.avatarGrad, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:'#fff', fontWeight:900, fontSize:15 }}>L</span>
        </div>
        <div>
          <p style={{ color:'#0f172a', fontWeight:900, fontSize:14, lineHeight:1.2 }}>Lokarya</p>
          <p style={{ color:'#94a3b8', fontSize:10, fontWeight:600 }}>{cfg.label} · {cfg.sub}</p>
        </div>
      </div>
      {closeMobile && (
        <button onClick={closeMobile}
          style={{ color:'#94a3b8', cursor:'pointer', background:'none', border:'none', padding:4, lineHeight:0 }}>
          <X size={17}/>
        </button>
      )}
    </div>

    {/* Nav */}
    <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
      {navItems.map(item => {
        const on = activePage === item.id;
        return (
          <button key={item.id}
            onClick={() => { onNavigate(item.id); closeMobile?.(); }}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
              borderRadius:9, cursor:'pointer', textAlign:'left',
              background:   on ? cfg.accentLight  : 'transparent',
              border:       on ? `1px solid ${cfg.accentBorder}` : '1px solid transparent',
              color:        on ? cfg.accentText    : '#64748b',
              fontWeight:   700, fontSize:13,
              transition:   'background 0.12s, color 0.12s',
              fontFamily:   'inherit',
            }}
            onMouseEnter={e => { if (!on) { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.color='#334155'; }}}
            onMouseLeave={e => { if (!on) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b'; }}}>
            <item.icon size={15} style={{ color: on ? cfg.accent : '#94a3b8', flexShrink:0 }}/>
            <span style={{ flex:1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ background:cfg.badgeBg, color:cfg.badgeText,
                borderRadius:999, padding:'1px 7px', fontSize:10, fontWeight:800, flexShrink:0 }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* User + logout */}
    <div style={{ padding:'10px 8px 12px', borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
        borderRadius:9, background:'#f8fafc', border:'1px solid #f1f5f9', marginBottom:4 }}>
        <div style={{ width:30, height:30, borderRadius:999, background:cfg.avatarGrad, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12 }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth:0, flex:1 }}>
          <p style={{ color:'#0f172a', fontWeight:700, fontSize:13, lineHeight:1.3,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name || 'User'}
          </p>
          <p style={{ color:'#94a3b8', fontSize:10, textTransform:'capitalize',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.vibhag || user?.organizationName || user?.role?.replace(/_/g,' ') || ''}
          </p>
        </div>
      </div>
      <button onClick={onLogout}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
          borderRadius:9, color:'#94a3b8', background:'transparent', border:'1px solid transparent',
          fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.12s', fontFamily:'inherit' }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { color:'#ef4444', background:'#fef2f2', borderColor:'#fecaca' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { color:'#94a3b8', background:'transparent', borderColor:'transparent' })}>
        <LogOut size={14}/> Logout
      </button>
    </div>
  </div>
);

// ── main layout ───────────────────────────────────────────────────────────────
const DashboardLayout = ({
  role = 'authority',
  navItems = [],
  activePage,
  onNavigate,
  children,
  pageTitle,
  pageSubtitle,
  alerts = [],
}) => {
  const { user, logout } = useAuth();
  const navigate   = useNavigate();
  const isDesktop  = useIsDesktop();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cfg   = ROLE_CONFIG[role] || ROLE_CONFIG.authority;
  const title = pageTitle || navItems.find(n => n.id === activePage)?.label || 'Dashboard';
  const sub   = pageSubtitle ||
    [user?.vibhag || user?.organizationName,
     new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })]
    .filter(Boolean).join(' · ');

  const doLogout = async () => { await logout(); navigate('/'); };

  // close mobile sidebar on desktop resize
  useEffect(() => { if (isDesktop) setMobileOpen(false); }, [isDesktop]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,900&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      <div style={{
        display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
        background: '#f8fafc', fontFamily: "'DM Sans', sans-serif",
        position: 'fixed', top: 0, left: 0,
      }}>

        {/* ── Desktop sidebar — only rendered on desktop ── */}
        {isDesktop && (
          <aside style={{
            width: 220, flexShrink: 0, height: '100%',
            background: '#ffffff', borderRight: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column', zIndex: 10,
          }}>
            <SidebarContent cfg={cfg} navItems={navItems} activePage={activePage}
              onNavigate={onNavigate} user={user} onLogout={doLogout}/>
          </aside>
        )}

        {/* ── Mobile sidebar overlay ── */}
        <AnimatePresence>
          {!isDesktop && mobileOpen && (
            <>
              {/* backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(15,23,42,0.35)' }}
              />
              {/* drawer */}
              <motion.aside
                initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                style={{
                  position: 'fixed', top: 0, left: 0, height: '100%', width: 220,
                  zIndex: 50, background: '#ffffff', borderRight: '1px solid #e2e8f0',
                  display: 'flex', flexDirection: 'column',
                }}>
                <SidebarContent cfg={cfg} navItems={navItems} activePage={activePage}
                  onNavigate={onNavigate} user={user} onLogout={doLogout}
                  closeMobile={() => setMobileOpen(false)}/>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main area ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>

          {/* Topbar */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', height: 60, flexShrink: 0,
            background: '#ffffff', borderBottom: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* hamburger — mobile only */}
              {!isDesktop && (
                <button onClick={() => setMobileOpen(true)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0',
                    background: '#f1f5f9', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Menu size={16} style={{ color: '#64748b' }}/>
                </button>
              )}
              <div>
                <h1 style={{ color: '#0f172a', fontWeight: 900, fontSize: 16, lineHeight: 1.3 }}>{title}</h1>
                <p style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{sub}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {alerts.map((a, i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                    borderRadius: 8, background: `${a.color}15`, border: `1px solid ${a.color}40`,
                    color: a.color, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {a.icon && <a.icon size={11}/>} {a.label}
                </motion.div>
              ))}

              {/* ← CHANGED: replaced dead <button><Bell/></button> with live component */}
              <NotificationBell accentColor={cfg.accent} />

            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}>
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
