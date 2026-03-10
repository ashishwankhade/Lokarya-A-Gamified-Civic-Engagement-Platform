// src/dashboards/authority/AuthorityDashboard.jsx
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListFilter, Users, BarChart3, Map, Flame } from 'lucide-react';
import DashboardLayout    from '../../layouts/DashboardLayout';
import AuthorityOverview  from './AuthorityOverview';
import ComplaintQueue     from './ComplaintQueue';
import ComplaintDetail    from './ComplaintDetail';
import FieldWorkerManager from './FieldWorkerManager';
import AuthorityAnalytics from './AuthorityAnalytics';
import MapView            from './MapView';
import api from '../../api/axios';

const AuthorityDashboard = () => {
  const [page,       setPage]       = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const [pending,    setPending]    = useState(0);
  const [breached,   setBreached]   = useState(0);

  const refresh = () => {
    api.get('/complaints').then(({ data }) => {
      setPending(data.filter(c => c.status === 'pending').length);
      setBreached(data.filter(c => c.slaBreached).length);
    }).catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  const NAV = [
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'queue',     label: 'Complaint Queue',  icon: ListFilter, badge: pending },
    { id: 'map',       label: 'Map View',         icon: Map },
    { id: 'workers',   label: 'Field Workers',    icon: Users },
    { id: 'analytics', label: 'Analytics',        icon: BarChart3 },
  ];

  const alerts = breached > 0
    ? [{ label: `${breached} SLA Breach${breached > 1 ? 'es' : ''}`, color: '#ef4444', icon: Flame }]
    : [];

  const handleSelect = (id) => setSelectedId(id);
  const handleBack   = ()   => { setSelectedId(null); refresh(); };

  return (
    <DashboardLayout role="authority" navItems={NAV}
      activePage={selectedId ? 'queue' : page}
      onNavigate={id => { setSelectedId(null); setPage(id); }}
      pageTitle={selectedId ? 'Complaint Detail' : undefined}
      alerts={alerts}>

      {selectedId ? (
        <ComplaintDetail complaintId={selectedId} onBack={handleBack} />
      ) : (
        <>
          {page === 'overview'  && <AuthorityOverview  onNavigate={setPage} onSelect={handleSelect} />}
          {page === 'queue'     && <ComplaintQueue     onSelect={handleSelect} />}
          {page === 'map'       && <MapView            onSelect={handleSelect} />}
          {page === 'workers'   && <FieldWorkerManager />}
          {page === 'analytics' && <AuthorityAnalytics />}
        </>
      )}
    </DashboardLayout>
  );
};

export default AuthorityDashboard;
