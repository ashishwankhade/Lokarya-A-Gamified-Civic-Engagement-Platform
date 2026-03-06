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
import DashboardLayout from './components/layout/DashboardLayout'; 
import ApprovalsPage from './pages/dashboards/ApprovalsPage';
import AuthorityInbox from './pages/dashboards/AuthorityInbox';
import AuthorityMap from './pages/dashboards/AuthorityMap';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import NGODashboard from './pages/dashboards/NGODashboard';
import AuthorityDashboard from './pages/dashboards/AuthorityDashboard';

// --- NGO SUB-PAGES IMPORTS ---
import CreateMission from './pages/NgoDash/CreateMission'; 
import VerifyVolunteers from './pages/NgoDash/VerifyVolunteers'; 

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
  // 1. UPDATED AUTH CHECK:
  // We now check for 'userInfo' because the 'token' is hidden in an HttpOnly cookie.
  const [isAuthenticated] = useState(!!localStorage.getItem("userInfo"));
  
  // 2. SAFE ROLE PARSING:
  // Prevents app crash if localStorage data is corrupted
  let userRole = 'user';
  try {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      userRole = JSON.parse(storedUser).role;
    }
  } catch (error) {
    console.error("Error parsing user info:", error);
    localStorage.removeItem("userInfo"); // Clean up bad data
  }

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
        
        {/* A. Super Admin Routes */}
        <Route 
          path="/dashboard/super-admin" 
          element={
            isAuthenticated && userRole === 'super_admin' 
              ? <DashboardLayout role="super_admin" /> 
              : <Navigate to="/" />
          } 
        >
           <Route index element={<SuperAdminDashboard />} />
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
           <Route path="create" element={<CreateMission />} />
           <Route path="edit/:id" element={<CreateMission />} />
           <Route path="verify" element={<VerifyVolunteers />} /> 
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