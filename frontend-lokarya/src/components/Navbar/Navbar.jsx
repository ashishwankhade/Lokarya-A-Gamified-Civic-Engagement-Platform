import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Trophy, Target, AlertTriangle, Home,
  User, LogOut, ChevronDown, Shield, Star, Zap,
  Award, Crown, Flame, ScanLine,
} from 'lucide-react';

import { useAuth }        from '../../context/AuthContext';
import NotificationBell   from '../Shared/NotificationBell';
import navbarLogo         from '../../assets/main-icon.png';
import LoginModal         from '../../pages/auth/LoginModal';
import RegisterModal      from '../../pages/auth/RegisterModal';

// ── Tier system ───────────────────────────────────────────────────────────────
const TIERS = [
  { level: 1, rank: 'Civic Scout',    minXp: 0,    Icon: Shield, color: '#64748b', bg: '#f1f5f9', bar: '#94a3b8' },
  { level: 2, rank: 'Urban Guardian', minXp: 200,  Icon: Star,   color: '#2563eb', bg: '#eff6ff', bar: '#3b82f6' },
  { level: 3, rank: 'Impact Maker',   minXp: 500,  Icon: Zap,    color: '#059669', bg: '#ecfdf5', bar: '#10b981' },
  { level: 4, rank: 'City Champion',  minXp: 1000, Icon: Award,  color: '#7c3aed', bg: '#f5f3ff', bar: '#8b5cf6' },
  { level: 5, rank: 'Lokarya Legend', minXp: 2000, Icon: Crown,  color: '#d97706', bg: '#fef3c7', bar: '#f59e0b' },
];

const getTier     = (xp = 0) => [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0];
const getNextTier = (xp = 0) => TIERS.find(t => t.minXp > xp) || null;
const getProgress = (xp = 0) => {
  const cur  = getTier(xp);
  const next = getNextTier(xp);
  if (!next) return 100;
  return Math.min(100, Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100));
};

const MenuLink = ({ to, icon, label, sub, onClick }) => (
  <Link
    to={to} onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 14,
      textDecoration: 'none', transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: '#f1f5f9', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <p style={{ fontSize: 13, fontWeight: 800, color: '#0f2c4a', lineHeight: 1.2 }}>{label}</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sub}</p>
    </div>
  </Link>
);

const ProfileNavBtn = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 18px', border: 'none', background: 'transparent',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 700,
    color: danger ? '#dc2626' : '#0f2c4a',
    transition: 'background 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? '#fef2f2' : '#f8fafc'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <span style={{ color: danger ? '#dc2626' : '#64748b' }}>{icon}</span>
    {label}
  </button>
);

const NV = '#0f2c4a';
const OR = '#F47C20';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading, logout } = useAuth();

  const [isMenuOpen,     setIsMenuOpen]     = useState(false);
  const [isScrolled,     setIsScrolled]     = useState(false);
  const [isLoginOpen,    setIsLoginOpen]    = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isProfileOpen,  setIsProfileOpen]  = useState(false);

  const menuRef    = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    window.__openLogin    = () => setIsLoginOpen(true);
    window.__openRegister = () => setIsRegisterOpen(true);
    return () => {
      delete window.__openLogin;
      delete window.__openRegister;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const h = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isProfileOpen]);

  const switchToRegister = () => { setIsLoginOpen(false);    setTimeout(() => setIsRegisterOpen(true), 200); };
  const switchToLogin    = () => { setIsRegisterOpen(false); setTimeout(() => setIsLoginOpen(true),    200); };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/');
  };

  const goTo = useCallback((path) => {
    setIsProfileOpen(false);
    navigate(path);
  }, [navigate]);

  const xp       = user?.xp || 0;
  const tier     = getTier(xp);
  const nextTier = getNextTier(xp);
  const progress = getProgress(xp);
  const TierIcon = tier.Icon;

  // FIX: use tier.rank instead of role label in the profile button
  const displayAvatar = user?.avatar
    ? user.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0f2c4a&color=fff&size=128`;

  if (loading) return (
    <nav style={{ position: 'sticky', top: 0, width: '100%', background: '#fff', zIndex: 50, borderBottom: '1px solid #f1f5f9', height: 72, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
      <img src={navbarLogo} alt="Lokarya" style={{ height: 44, objectFit: 'contain' }} />
    </nav>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGGED-IN NAV
  // ═══════════════════════════════════════════════════════════════════════════
  if (isLoggedIn) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;700;800;900&display=swap');`}</style>

      <nav style={{
        position: 'sticky', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: isScrolled ? '1px solid #e2e8f0' : '1px solid #f8fafc',
        boxShadow: isScrolled ? '0 2px 20px rgba(15,44,74,0.06)' : 'none',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <img src={navbarLogo} alt="Lokarya" style={{ height: 44, objectFit: 'contain', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* XP chip */}
            <motion.button
              onClick={() => goTo('/rewards')}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                display: 'none',
                alignItems: 'center', gap: 6,
                background: `linear-gradient(135deg, ${NV} 0%, #164e63 100%)`,
                border: 'none', borderRadius: 12,
                padding: '7px 14px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
              className="xp-chip"
            >
              <Zap size={13} fill={OR} style={{ color: OR }} />
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 15, color: OR }}>{xp}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>XP</span>
              <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
              <TierIcon size={13} style={{ color: tier.color }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{tier.rank}</span>
            </motion.button>

            <style>{`.xp-chip { display: flex !important; } @media(max-width:640px){ .xp-chip { display: none !important; } }`}</style>

            {user?.role === 'citizen' && (
              <motion.button
                onClick={() => navigate('/scan-qr')}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                className="scan-qr-btn"
                style={{
                  display: 'none',
                  alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg,#F47C20,#f59e0b)',
                  border: 'none', borderRadius: 12,
                  padding: '7px 14px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 4px 12px rgba(244,124,32,0.35)',
                }}
              >
                <ScanLine size={14} style={{ color: '#fff' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Scan QR</span>
              </motion.button>
            )}
            <style>{`.scan-qr-btn { display: flex !important; } @media(max-width:768px){ .scan-qr-btn { display: none !important; } }`}</style>

            <NotificationBell />

            {/* Profile dropdown trigger */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: isProfileOpen ? '#f8fafc' : 'transparent',
                  border: isProfileOpen ? `1.5px solid ${NV}` : '1.5px solid transparent',
                  borderRadius: 14, padding: '5px 10px 5px 5px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {/* ── Avatar with XP progress ring ── */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    padding: 2,
                    // FIX: conic-gradient ring shows XP progress around the avatar
                    background: `conic-gradient(${tier.color} ${progress}%, #e2e8f0 0%)`,
                  }}>
                    {/* FIX: always show user's actual avatar (or initials fallback) */}
                    <img
                      src={displayAvatar}
                      alt={user?.name || 'avatar'}
                      style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid #fff', display: 'block',
                      }}
                      // fallback if avatar URL 404s
                      onError={e => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0f2c4a&color=fff&size=128`;
                      }}
                    />
                  </div>
                  {/* Level dot badge */}
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    background: tier.color, borderRadius: '50%',
                    width: 16, height: 16, border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{tier.level}</span>
                  </div>
                </div>

                {/* Name + rank label (hidden on mobile) */}
                <div style={{ display: 'none' }} className="profile-label">
                  <p style={{
                    fontSize: 12, fontWeight: 800, color: NV,
                    lineHeight: 1.2, maxWidth: 110,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user?.name || 'User'}
                  </p>
                  {/* FIX: show tier.rank (e.g. "Civic Scout") instead of role (e.g. "citizen") */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <TierIcon size={9} style={{ color: tier.color }} />
                    <p style={{
                      fontSize: 10, fontWeight: 800,
                      color: tier.color,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {tier.rank}
                    </p>
                  </div>
                </div>
                <style>{`.profile-label { display: block !important; } @media(max-width:640px){ .profile-label { display: none !important; } }`}</style>

                <ChevronDown size={13} style={{
                  color: '#94a3b8', transition: 'transform 0.2s',
                  transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1    }}
                    exit={{    opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                      width: 290, background: '#fff', borderRadius: 20,
                      boxShadow: '0 20px 60px rgba(15,44,74,0.15), 0 4px 16px rgba(15,44,74,0.08)',
                      border: '1.5px solid #f0ebe3', overflow: 'hidden', zIndex: 9999,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {/* Gamification header inside dropdown */}
                    <div style={{
                      background: `linear-gradient(135deg, ${NV} 0%, #164e63 100%)`,
                      padding: '18px 18px 16px', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${tier.color}40 0%, transparent 70%)`, pointerEvents: 'none' }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative', zIndex: 1 }}>
                        {/* FIX: avatar in dropdown also uses displayAvatar with onError fallback */}
                        <div style={{ width: 44, height: 44, borderRadius: '50%', padding: 2, background: `conic-gradient(${tier.color} ${progress}%, rgba(255,255,255,0.15) 0%)`, flexShrink: 0 }}>
                          <img
                            src={displayAvatar}
                            alt={user?.name || 'avatar'}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', display: 'block' }}
                            onError={e => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0f2c4a&color=fff&size=128`;
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 900, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || 'User'}
                          </p>
                          {/* FIX: tier rank shown here too */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <TierIcon size={11} style={{ color: tier.color }} />
                            <span style={{ fontSize: 10, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {tier.rank}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: OR, lineHeight: 1 }}>{xp}</div>
                          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total XP</div>
                        </div>
                      </div>

                      {/* XP progress bar */}
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Level {tier.level} of 5
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {nextTier ? `${nextTier.minXp - xp} XP to ${nextTier.rank}` : '🏆 Max Rank'}
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 999, background: `linear-gradient(to right, ${tier.bar}, ${OR})` }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                          {TIERS.map(t => (
                            <div key={t.level} style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: xp >= t.minXp ? t.color : 'rgba(255,255,255,0.15)',
                              transition: 'background 0.3s',
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nav links */}
                    <div style={{ padding: '8px 0' }}>
                      <ProfileNavBtn icon={<User size={16} />}          label="My Profile"  onClick={() => goTo('/profile')}      />
                      <ProfileNavBtn icon={<Target size={16} />}        label="Missions"    onClick={() => goTo('/activities')}   />
                      <ProfileNavBtn icon={<AlertTriangle size={16} />} label="Complaints"  onClick={() => goTo('/report-issue')} />
                      <ProfileNavBtn
                        icon={<Trophy size={16} style={{ color: OR }} />}
                        label={
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            Rewards Store
                            {xp > 0 && (
                              <span style={{ background: OR, color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 800, padding: '1px 6px' }}>
                                {xp} XP
                              </span>
                            )}
                          </span>
                        }
                        onClick={() => goTo('/rewards')}
                      />
                      {user?.role === 'citizen' && (
                        <ProfileNavBtn
                          icon={<ScanLine size={16} style={{ color: OR }} />}
                          label="Scan QR at Venue"
                          onClick={() => goTo('/scan-qr')}
                        />
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                      <ProfileNavBtn icon={<LogOut size={16} />} label="Logout" onClick={handleLogout} danger />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // GUEST NAV
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;700;800;900&display=swap');`}</style>

      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'sticky', top: 0, width: '100%', zIndex: 50,
          background: isScrolled ? 'rgba(255,255,255,0.95)' : '#fff',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${isScrolled ? '#e2e8f0' : '#f8fafc'}`,
          boxShadow: isScrolled ? '0 2px 20px rgba(15,44,74,0.06)' : 'none',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.3s',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

          <Link to="/" style={{ flexShrink: 0, textDecoration: 'none' }}>
            <img src={navbarLogo} alt="Lokarya" style={{ height: 44, objectFit: 'contain' }} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }} ref={menuRef}>
            <div style={{ display: 'none' }} className="desktop-auth">
              <button
                onClick={() => setIsLoginOpen(true)}
                style={{ padding: '8px 18px', background: 'transparent', border: `1.5px solid ${NV}`, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 13, color: NV, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = NV; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NV; }}
              >
                Login
              </button>
              <button
                onClick={() => setIsRegisterOpen(true)}
                style={{ padding: '8px 20px', background: OR, border: 'none', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 13, color: '#fff', cursor: 'pointer', boxShadow: `0 4px 14px ${OR}45`, transition: 'all 0.2s', marginLeft: 8 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Join Free
              </button>
            </div>
            <style>{`.desktop-auth { display: flex !important; align-items: center; } @media(max-width:640px){ .desktop-auth { display: none !important; } }`}</style>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setIsMenuOpen(o => !o)}
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: isMenuOpen ? NV : '#f1f5f9',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              {isMenuOpen
                ? <X size={20} style={{ color: '#fff' }} />
                : <Menu size={20} style={{ color: NV }} />
              }
            </motion.button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1    }}
                  exit={{    opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                    width: 280, background: '#fff', borderRadius: 20,
                    boxShadow: '0 20px 60px rgba(15,44,74,0.15)',
                    border: '1.5px solid #f0ebe3', overflow: 'hidden', zIndex: 9999,
                  }}
                >
                  <div style={{
                    background: `linear-gradient(135deg, ${NV}, #164e63)`,
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Flame size={16} style={{ color: OR }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 12, color: '#fff', marginBottom: 2 }}>Earn XP. Climb ranks.</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Join free — start as Civic Scout</p>
                    </div>
                  </div>

                  <div style={{ padding: '8px 6px' }}>
                    <MenuLink to="/"            icon={<Home size={16} style={{ color: NV }} />}                  label="Home"          sub="Landing Page"  onClick={() => setIsMenuOpen(false)} />
                    <MenuLink to="/rewards"      icon={<Trophy size={16} style={{ color: OR }} />}               label="Rewards Hub"   sub="XP & Vouchers" onClick={() => setIsMenuOpen(false)} />
                    <MenuLink to="/activities"   icon={<Target size={16} style={{ color: '#2563eb' }} />}        label="Mission Board" sub="Social Tasks"  onClick={() => setIsMenuOpen(false)} />
                    <MenuLink to="/report-issue" icon={<AlertTriangle size={16} style={{ color: '#dc2626' }} />} label="Complaints"    sub="Report Issues" onClick={() => setIsMenuOpen(false)} />
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => { setIsMenuOpen(false); setIsLoginOpen(true); }}
                      style={{ padding: '11px', background: '#f8fafc', border: `1.5px solid #e2e8f0`, borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 13, color: NV, cursor: 'pointer' }}>
                      Login
                    </button>
                    <button onClick={() => { setIsMenuOpen(false); setIsRegisterOpen(true); }}
                      style={{ padding: '11px', background: OR, border: 'none', borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 13, color: '#fff', cursor: 'pointer', boxShadow: `0 4px 14px ${OR}45` }}>
                      Join Free
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      <LoginModal    isOpen={isLoginOpen}    onClose={() => setIsLoginOpen(false)}    onSwitchToRegister={switchToRegister} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onSwitchToLogin={switchToLogin} />
    </>
  );
};

export default Navbar;
