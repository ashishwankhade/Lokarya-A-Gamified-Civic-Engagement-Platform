import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import HeroSection     from "../components/Hero/HeroSection.jsx";
import MissionCarousel from "../components/Cards/MissionCarousel.jsx";
import AboutProgram    from "../components/Cards/AboutCard.jsx";
import RewardsSection  from "../components/BadgeCard/RewardsSection.jsx";

// Dashboard roles get redirected away from landing page immediately.
// Citizens stay here normally.
const ROLE_REDIRECT = {
  ngo_admin:       '/dashboard/ngo',
  local_authority: '/dashboard/authority',
  super_admin:     '/dashboard/admin',
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;                            // wait for auth to resolve
    if (!isLoggedIn) return;                        // guest — show landing page
    const dest = ROLE_REDIRECT[user?.role];
    if (dest) navigate(dest, { replace: true });    // ngo/admin/authority → dashboard
    // citizen role has no entry in map → stays on landing page
  }, [isLoggedIn, loading, user?.role]);

  const handleJoin   = () => navigate('/register');
  const handleReport = () => navigate('/report-issue');

  // Avoid flashing landing page content before redirect fires for dashboard roles
  if (!loading && isLoggedIn && ROLE_REDIRECT[user?.role]) return null;

  return (
    <div style={{ overflowX: 'hidden' }}>
      <HeroSection    onJoin={handleJoin} onReport={handleReport} />
      <MissionCarousel />
      <AboutProgram   onJoin={handleJoin} onReport={handleReport} />
      <RewardsSection />
    </div>
  );
};

export default LandingPage;
