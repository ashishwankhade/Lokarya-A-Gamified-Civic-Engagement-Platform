import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NGODashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/ngo')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <DashboardLayout role="ngo_admin">
      <h2 className="text-2xl font-bold mb-6">Mission Control</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-blue-100">Active Missions</p>
          <h3 className="text-4xl font-bold">{data?.stats.activeMissions}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500">Volunteers Waiting Verification</p>
          <h3 className="text-4xl font-bold text-orange-500">{data?.stats.pendingVolunteers}</h3>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NGODashboard;