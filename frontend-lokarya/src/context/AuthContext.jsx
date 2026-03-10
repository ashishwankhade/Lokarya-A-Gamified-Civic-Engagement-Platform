// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const ACTION_LABELS = {
  file_complaint:        'Complaint Filed',
  first_complaint:       'First Complaint Bonus!',
  rate_feedback:         'Feedback Given',
  attend_ngo_activity:   'NGO Activity Attended',
  complaint_resolved:    'Complaint Resolved',
  verify_duplicate:      'Duplicate Verified',
  refer_friend:          'Friend Referred',
  streak_7day:           '7-Day Streak Bonus!',
  ngo_create_mission:    'Mission Approved',
  ngo_mission_completed: 'Mission Completed',
  admin_manual_award:    'Admin Award',
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [xpToasts, setXpToasts] = useState([]);
  const [xpData,   setXpData]   = useState(null);

  // ── On mount: verify session ──────────────────────────────────────────────
  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        setXpData({ xp: data.xp ?? 0, level: data.level ?? 1 });
      } catch {
        setUser(null);
        setXpData(null);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback((userData) => {
    setUser(userData);
    setXpData({ xp: userData.xp ?? 0, level: userData.level ?? 1 });
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  // FIX: removed stale localStorage.removeItem('userInfo') — tokens are
  // never stored in localStorage (httpOnly cookies only). Dead code removed.
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local state even if the server request fails
    } finally {
      setUser(null);
      setXpData(null);
      setXpToasts([]);
    }
  }, []);

  // ── updateUser ────────────────────────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
    if (updates.xp !== undefined || updates.level !== undefined) {
      setXpData(prev => ({
        xp:    updates.xp    ?? prev?.xp    ?? 0,
        level: updates.level ?? prev?.level ?? 1,
      }));
    }
  }, []);

  // ── dismissToast ──────────────────────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    setXpToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── addXpToast ────────────────────────────────────────────────────────────
  const addXpToast = useCallback((xp, action, leveledUp = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    setXpToasts(prev => [...prev, {
      id,
      amount:   xp,
      label:    ACTION_LABELS[action] || action,
      action,
      leveledUp,
    }]);
    setXpData(prev => ({
      xp:    (prev?.xp ?? 0) + xp,
      level: prev?.level ?? 1,
    }));
    setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  // ── Derived role helpers ──────────────────────────────────────────────────
  const isLoggedIn  = !!user;
  const role        = user?.role ?? null;
  const isCitizen   = role === 'citizen';
  const isNGO       = role === 'ngo_admin';
  const isAuthority = role === 'local_authority' || role === 'super_admin';
  const isAdmin     = role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user, loading, isLoggedIn,
      role, isCitizen, isNGO, isAuthority, isAdmin,
      login, logout, updateUser,
      xpData, xpToasts, addXpToast, dismissToast,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
