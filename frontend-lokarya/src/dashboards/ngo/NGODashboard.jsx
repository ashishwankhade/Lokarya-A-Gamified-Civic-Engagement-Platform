/**
 * NGODashboard.jsx
 * Main shell — uses shared DashboardLayout (emerald theme for NGO role).
 * Pages: overview · missions · create · attendance · analytics
 *
 * Path: src/dashboards/ngo/NGODashboard.jsx
 *
 * FIXES applied:
 *  [1] Auth race condition — role check now guards on isLoggedIn AND user loaded
 *  [2] attendMissionId reset — cleared when navigating to Attendance via sidebar
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, PlusCircle,
  QrCode, BarChart3,
} from 'lucide-react';

import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth }     from '../../context/AuthContext';
import api             from '../../api/axios';

import NGOOverview     from './NGOOverview';
import MissionManager  from './MissionManager';
import CreateMission   from './CreateMission';
import AttendancePanel from './AttendancePanel';
import NGOAnalytics    from './NGOAnalytics';

/* ── nav items ──────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',       icon: LayoutDashboard },
  { id: 'missions',   label: 'My Missions',     icon: ListChecks      },
  { id: 'create',     label: 'Create Mission',  icon: PlusCircle      },
  { id: 'attendance', label: 'Attendance & QR', icon: QrCode          },
  { id: 'analytics',  label: 'Analytics',       icon: BarChart3       },
];

const PAGE_META = {
  overview:   { title: 'Overview',        subtitle: 'Your NGO at a glance'                      },
  missions:   { title: 'My Missions',     subtitle: 'Manage, edit and track your missions'       },
  create:     { title: 'Create Mission',  subtitle: 'Deploy a new civic mission for volunteers'  },
  attendance: { title: 'Attendance & QR', subtitle: 'Live QR scanning and volunteer attendance'  },
  analytics:  { title: 'Analytics',       subtitle: 'XP distributed, volunteer trends and more'  },
};

/* ── component ──────────────────────────────────────────────────────────── */
const NGODashboard = () => {
  const navigate             = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [activePage,      setActivePage]      = useState('overview');
  const [pendingCount,    setPendingCount]     = useState(0);
  const [editMissionId,   setEditMissionId]    = useState(null);
  const [attendMissionId, setAttendMissionId]  = useState(null);

  /* ── FIX [1]: guard with isLoggedIn AND user fully loaded ───────────── */
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    // Only redirect after user object is actually populated
    if (user?.role && !['ngo_admin', 'super_admin'].includes(user.role)) {
      navigate('/');
    }
  }, [isLoggedIn, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  /* fetch pending approval count for badge */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/activities/pending-approvals');
        setPendingCount(Array.isArray(data) ? data.length : 0);
      } catch { /* silent */ }
    };
    load();
  }, [activePage]);

  /* nav items with dynamic badge */
  const navItems = NAV_ITEMS.map(n =>
    n.id === 'attendance' && pendingCount > 0
      ? { ...n, badge: pendingCount }
      : n
  );

  const meta = PAGE_META[activePage] || PAGE_META.overview;

  /* navigate to attendance with a specific mission pre-selected */
  const openAttendance = (missionId) => {
    setAttendMissionId(missionId);
    setActivePage('attendance');
  };

  /* navigate to edit */
  const openEdit = (missionId) => {
    setEditMissionId(missionId);
    setActivePage('create');
  };

  /* navigate to create (fresh) */
  const openCreate = () => {
    setEditMissionId(null);
    setActivePage('create');
  };

  /* ── FIX [2]: reset attendMissionId when navigating to Attendance ────── */
  const handleNavigate = (pageId) => {
    if (pageId === 'create') { openCreate(); return; }
    // Reset pre-selected mission when going to Attendance via the sidebar
    // (openAttendance() sets it explicitly when coming from a mission card)
    if (pageId === 'attendance') setAttendMissionId(null);
    setActivePage(pageId);
  };

  /* render active page */
  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <NGOOverview
            onGoToMissions={() => setActivePage('missions')}
            onGoToCreate={openCreate}
            onOpenAttendance={openAttendance}
          />
        );
      case 'missions':
        return (
          <MissionManager
            onEdit={openEdit}
            onOpenAttendance={openAttendance}
            onGoToCreate={openCreate}
          />
        );
      case 'create':
        return (
          <CreateMission
            editId={editMissionId}
            onSuccess={() => { setEditMissionId(null); setActivePage('missions'); }}
            onCancel={() => { setEditMissionId(null); setActivePage('missions'); }}
          />
        );
      case 'attendance':
        return (
          <AttendancePanel
            defaultMissionId={attendMissionId}
            onBack={() => setActivePage('missions')}
          />
        );
      case 'analytics':
        return <NGOAnalytics />;
      default:
        return <NGOOverview />;
    }
  };

  return (
    <DashboardLayout
      role="ngo"
      navItems={navItems}
      activePage={activePage}
      onNavigate={handleNavigate}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      {renderPage()}
    </DashboardLayout>
  );
};

export default NGODashboard;