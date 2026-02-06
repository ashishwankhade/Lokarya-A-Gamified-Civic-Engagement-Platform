import React, { useState } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";

// --- EXISTING IMPORTS ---
import Navbar from './components/Navbar/Navbar';
import NavbarUser from './components/Navbar/NavbarUser';
import Footer from './components/Footer/Footer';
import LandingPage from './pages/LandingPage';
import ChatBubble from './components/ChatBot/ChatBubble';
import ComplaintPage from './pages/ComplaintPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';
import RewardsPage from './pages/RewardsPage';

// --- NEW DASHBOARD IMPORTS ---
// 1. Import the Layout (The Shell)
import DashboardLayout from './components/layout/DashboardLayout'; 
// import other dashboard pages as needed
import ApprovalsPage from './pages/dashboards/ApprovalsPage';
import AuthorityInbox from './pages/dashboards/AuthorityInbox';
import AuthorityMap from './pages/dashboards/AuthorityMap';

// 2. Import the Pages (The Content)
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import NGODashboard from './pages/dashboards/NGODashboard';
import AuthorityDashboard from './pages/dashboards/AuthorityDashboard';


// Existing Layout for Regular Users
const MainLayout = ({ isAuthenticated }) => {
  return (
    <>
      {isAuthenticated ? <NavbarUser /> : <Navbar />}
      <Outlet /> 
      <ChatBubble />
      <Footer />
    </>
  );
};

const App = () => {
  // Auth Check
  const [isAuthenticated] = useState(!!localStorage.getItem("token"));
  const userRole = JSON.parse(localStorage.getItem("userInfo") || '{}').role;

  return (
    <Router>
      <Routes>

        {/* --- SECTION 1: PUBLIC / USER WEBSITE --- */}
        <Route element={<MainLayout isAuthenticated={isAuthenticated} />}>
           <Route path="/" element={<LandingPage />} />
           <Route path="/report-issue" element={<ComplaintPage />} />
           <Route path="/activities" element={<ActivityPage />} />
           <Route path="/profile" element={<ProfilePage />} />
           <Route path="/rewards" element={<RewardsPage />} />
        </Route>

        {/* --- SECTION 2: ADMIN DASHBOARDS --- */}
        {/* WE USE NESTED ROUTES HERE so the Sidebar stays visible */}
        
        {/* A. Super Admin Routes */}
        <Route 
          path="/dashboard/super-admin" 
          element={
            isAuthenticated && userRole === 'super_admin' 
              ? <DashboardLayout role="super_admin" />  // <--- Render Layout First
              : <Navigate to="/" />
          } 
        >
           {/* The actual dashboard page renders inside the Layout's <Outlet> */}
           <Route index element={<SuperAdminDashboard />} />
           
           {/* Future sub-pages can go here, e.g.: */}
           <Route path="approvals" element={<ApprovalsPage />} />
        </Route>

        {/* B. NGO Admin Routes */}
        <Route 
          path="/dashboard/ngo" 
          element={
            isAuthenticated && userRole === 'ngo_admin' 
              ? <DashboardLayout role="ngo_admin" /> 
              : <Navigate to="/" />
          } 
        >
           <Route index element={<NGODashboard />} />
        </Route>

        {/* C. Authority Routes */}
        <Route 
          path="/dashboard/authority" 
          element={
            isAuthenticated && userRole === 'local_authority' 
              ? <DashboardLayout role="local_authority" /> 
              : <Navigate to="/" />
          } 
        >
           <Route index element={<AuthorityDashboard />} />
            <Route path="inbox" element={<AuthorityInbox />} />
            <Route path="map" element={<AuthorityMap />} />
        </Route>

      </Routes>
    </Router>
  );
};

export default App;