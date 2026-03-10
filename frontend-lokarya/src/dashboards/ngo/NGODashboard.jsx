/**
 * NGODashboard.jsx
 * Main shell — uses shared DashboardLayout (emerald theme for NGO role).
 * Pages: overview · missions · create · attendance · analytics
 *
 * Path: src/dashboards/ngo/NGODashboard.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, PlusCircle,
  QrCode, BarChart3, ChevronRight,
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
  { id: 'overview',    label: 'Overview',        icon: LayoutDashboard },
  { id: 'missions',    label: 'My Missions',      icon: ListChecks      },
  { id: 'create',      label: 'Create Mission',   icon: PlusCircle      },
  { id: 'attendance',  label: 'Attendance & QR',  icon: QrCode          },
  { id: 'analytics',   label: 'Analytics',        icon: BarChart3       },
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
  const navigate               = useNavigate();
  const { user, isLoggedIn }   = useAuth();

  const [activePage,      setActivePage]      = useState('overview');
  const [pendingCount,    setPendingCount]     = useState(0);
  const [editMissionId,   setEditMissionId]    = useState(null);   // passed to CreateMission for edit mode
  const [attendMissionId, setAttendMissionId]  = useState(null);   // passed to AttendancePanel

  /* redirect if not NGO */
  useEffect(() => {
    if (!isLoggedIn) navigate('/');
    if (user?.role && !['ngo_admin', 'super_admin'].includes(user.role)) navigate('/');
  }, [isLoggedIn, user]);

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

  /* page meta */
  const meta = PAGE_META[activePage] || PAGE_META.overview;

  /* navigate to attendance with a specific mission */
  const openAttendance = (missionId) => {
    setAttendMissionId(missionId);
    setActivePage('attendance');
  };

  /* navigate to edit a mission */
  const openEdit = (missionId) => {
    setEditMissionId(missionId);
    setActivePage('create');
  };

  /* when create page mounts fresh (no edit) */
  const openCreate = () => {
    setEditMissionId(null);
    setActivePage('create');
  };

  const handleNavigate = (pageId) => {
    if (pageId === 'create') { openCreate(); return; }
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
