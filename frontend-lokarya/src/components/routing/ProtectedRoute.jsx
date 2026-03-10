// src/components/routing/ProtectedRoute.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Wraps routes that require authentication and/or specific roles.
//
// Usage in App.jsx:
//
//   // Any logged-in user
//   <Route path="/complaints" element={
//     <ProtectedRoute><ComplaintPage /></ProtectedRoute>
//   } />
//
//   // Specific roles only
//   <Route path="/admin" element={
//     <AdminRoute><AdminPage /></AdminRoute>
//   } />
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Full-screen loading state ────────────────────────────────────────────────
const AuthLoading = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-500"
    />
    <p className="text-sm font-bold text-gray-400 tracking-wide">
      Verifying session…
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  roles      = [],   // empty = any logged-in user; array = specific roles only
  redirectTo = '/',  // where to send unauthenticated users
}) => {
  const { isLoggedIn, role, loading } = useAuth();
  const location = useLocation();

  // 1. Still verifying session on mount — show spinner, never redirect prematurely
  if (loading) return <AuthLoading />;

  // 2. Not logged in → redirect, preserve intended destination for post-login redirect
  if (!isLoggedIn) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. Role check — only enforce if roles array is non-empty
  if (roles.length > 0 && !roles.includes(role)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ requiredRoles: roles, userRole: role, from: location }}
        replace
      />
    );
  }

  // 4. All checks passed
  return children;
};

// ─── Role-specific convenience wrappers ──────────────────────────────────────
// FIX: all role strings now match User model enum exactly

export const CitizenRoute = ({ children }) => (
  <ProtectedRoute roles={['citizen']}>{children}</ProtectedRoute>
);

// FIX: was 'ngo' — corrected to 'ngo_admin'
export const NGORoute = ({ children }) => (
  <ProtectedRoute roles={['ngo_admin']}>{children}</ProtectedRoute>
);

export const AuthorityRoute = ({ children }) => (
  <ProtectedRoute roles={['local_authority', 'super_admin']}>{children}</ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute roles={['super_admin']}>{children}</ProtectedRoute>
);

// FIX: removed unused AccessDenied component — dead code eliminated.
// An /unauthorized route/page should handle that UI instead.

export default ProtectedRoute;
