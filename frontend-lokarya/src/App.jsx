// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';   // ← useAuth added
import ProtectedRoute from './components/routing/ProtectedRoute';

import Navbar     from './components/Navbar/Navbar';
import Footer     from './components/Footer/Footer';
import ChatBubble from './components/ChatBot/ChatBubble';

import LandingPage   from './pages/LandingPage';
import ComplaintPage from './pages/ComplaintPage';
import ActivityPage  from './pages/ActivityPage';
import RewardsPage   from './pages/RewardsPage';
import ProfilePage   from './pages/ProfilePage';
import QrScanPage    from './pages/QrScanPage';
import XpToastLayer  from './components/Shared/XpToastLayer';
import OAuthCallbackPage from './components/OAuthCallbackPage';


import AuthorityDashboard from './dashboards/authority/AuthorityDashboard';
import NGODashboard       from './dashboards/ngo/NGODashboard';
import AdminDashboard     from './dashboards/admin/AdminDashboard';
import WorkerUploadPage   from './pages/WorkerUploadPage';


// ── Navbar + Footer shell for public pages ───────────────────────────────────
const MainLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <ChatBubble />
    <Footer />
  </>
);

// ── XP toast layer — must live INSIDE <AuthProvider> so useAuth() works ──────
const AppShell = ({ children }) => {
  const { xpToasts, dismissToast } = useAuth();
  return (
    <>
      {children}
      <XpToastLayer toasts={xpToasts} onDismiss={dismissToast} />
    </>
  );
};

// ── Root — AuthProvider wraps AppShell so context is available ───────────────
const App = () => (
  <Router>
    <AuthProvider>
      <AppShell>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>

          {/* ── Public pages (Navbar + Footer) ─────────────────────────── */}
          <Route element={<MainLayout />}>
            <Route path="/"             element={<LandingPage />}   />
            <Route path="/report-issue" element={<ComplaintPage />} />
            <Route path="/activities"   element={<ActivityPage />}  />
            <Route path="/rewards"      element={<RewardsPage />}   />
            <Route path="/scan-qr"      element={<QrScanPage />}    />
            <Route path="/worker/upload" element={<WorkerUploadPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />


            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
          </Route>

          {/* ── Dashboards (full-screen, no MainLayout) ────────────────── */}
          <Route path="/dashboard/authority" element={
            <ProtectedRoute roles={['local_authority']}>
              <AuthorityDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/ngo" element={
            <ProtectedRoute roles={['ngo_admin']}>
              <NGODashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={['super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AppShell>
    </AuthProvider>
  </Router>
);

export default App;
