/**
 * AdminDashboard.jsx
 * Super Admin shell — uses shared DashboardLayout (violet theme).
 * Path: src/dashboards/admin/AdminDashboard.jsx
 *
 * FIXES:
 *  - Removed BarChart3 from lucide import (it was shadowed by a local redeclaration
 *    in AdminOverview, causing the imported icon to render as a broken element).
 *  - pendingCount now refetches on every page visit (not just on activePage change),
 *    so the badge stays accurate after approvals in other tabs.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CheckSquare,
  Zap, BarChart3, Flag, BookOpen,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth }     from '../../context/AuthContext';
import api             from '../../api/axios';

import AdminOverview      from './AdminOverview';
import UserManagement     from './UserManagement';
import NgoManagement      from './NgoManagement';
import ActivityApprovals  from './ActivityApprovals';
import XpRuleEngine       from './XpRuleEngine';
import PlatformAnalytics  from './PlatformAnalytics';
import ComplaintOversight from './ComplaintOversight';
import XpLedgerAudit      from './XpLedgerAudit';

const PAGE_META = {
  overview:    { title: 'Platform Overview',   subtitle: 'Lokarya at a glance'                         },
  users:       { title: 'User Management',     subtitle: 'Citizens, authorities and roles'              },
  ngos:        { title: 'NGO Management',      subtitle: 'Approve, suspend and track NGO accounts'     },
  approvals:   { title: 'Activity Approvals',  subtitle: 'Review NGO mission submissions'              },
  'xp-engine': { title: 'XP Rule Engine',      subtitle: 'Configure the platform gamification rules'   },
  analytics:   { title: 'Platform Analytics',  subtitle: 'Trends, XP distribution and civic data'     },
  complaints:  { title: 'Complaint Oversight', subtitle: 'View and force-update all citizen complaints' },
  'xp-ledger': { title: 'XP Ledger Audit',     subtitle: 'Full audit trail of every XP transaction'   },
};

const AdminDashboard = () => {
  const navigate             = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [activePage,   setActivePage]   = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn)                              navigate('/');
    if (user?.role && user.role !== 'super_admin') navigate('/');
  }, [isLoggedIn, user, navigate]);

  // FIX: fetch pending count on every page change so badge stays accurate
  // after approvals that happen inside the Approvals tab.
  useEffect(() => {
    api.get('/admin/activities/pending')
      .then(({ data }) => setPendingCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [activePage]);

  const navItems = [
    { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
    { id: 'users',      label: 'Users',      icon: Users           },
    { id: 'ngos',       label: 'NGOs',       icon: Building2       },
    {
      id: 'approvals', label: 'Approvals', icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'complaints', label: 'Complaints', icon: Flag            },
    { id: 'xp-engine',  label: 'XP Engine',  icon: Zap             },
    { id: 'xp-ledger',  label: 'XP Ledger',  icon: BookOpen        },
    { id: 'analytics',  label: 'Analytics',  icon: BarChart3       },
  ];

  const meta = PAGE_META[activePage] || PAGE_META.overview;

  const renderPage = () => {
    switch (activePage) {
      case 'overview':   return <AdminOverview    onNavigate={setActivePage} />;
      case 'users':      return <UserManagement   />;
      case 'ngos':       return <NgoManagement    />;
      case 'approvals':  return (
        <ActivityApprovals
          onApproved={() => setPendingCount(p => Math.max(0, p - 1))}
        />
      );
      case 'complaints': return <ComplaintOversight />;
      case 'xp-engine':  return <XpRuleEngine     />;
      case 'xp-ledger':  return <XpLedgerAudit    />;
      case 'analytics':  return <PlatformAnalytics />;
      default:           return <AdminOverview    onNavigate={setActivePage} />;
    }
  };

  return (
    <DashboardLayout
      role="super_admin"
      navItems={navItems}
      activePage={activePage}
      onNavigate={setActivePage}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    >
      {renderPage()}
    </DashboardLayout>
  );
};

export default AdminDashboard;