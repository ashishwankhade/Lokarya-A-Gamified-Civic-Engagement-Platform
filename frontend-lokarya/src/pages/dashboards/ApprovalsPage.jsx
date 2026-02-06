import React, { useEffect, useState } from 'react';
import { Check, X, UserPlus, Shield, Building2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending'); 
  const [pendingUsers, setPendingUsers] = useState([]);
  
  // New State for Success Message
  const [createdUser, setCreatedUser] = useState(null); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'local_authority'
  });

  // --- 1. Fetch Pending Users ---
  const fetchPending = async () => {
    try {
      const { data } = await api.get('/admin/pending');
      setPendingUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // --- 2. Approve/Reject Logic ---
  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await api.put(`/admin/approve/${id}`);
        toast.success('User Approved');
      } else {
        await api.delete(`/admin/reject/${id}`);
        toast.info('User Rejected');
      }
      setPendingUsers(pendingUsers.filter(u => u._id !== id));
    } catch (error) {
      toast.error('Action failed');
    }
  };

  // --- 3. Create User Logic ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreatedUser(null); // Reset previous success

    try {
      const { data } = await api.post('/admin/create-user', formData);
      
      // Show Success Message on Screen (Persistence)
      setCreatedUser({
        name: data.name,
        email: data.email,
        role: data.role,
        password: formData.password // Keep password visible temporarily so Admin can copy it
      });

      toast.success('Account Created Successfully!');
      
      // Reset Form
      setFormData({ name: '', email: '', password: '', role: 'local_authority' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Creation failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="User Management" 
        subtitle="Manage access control and onboard new authorities."
        action={
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white shadow text-[#0f4c75]' : 'text-gray-500'}`}
            >
              Pending Requests
            </button>
            <button 
              onClick={() => { setActiveTab('create'); setCreatedUser(null); }}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-white shadow text-[#0f4c75]' : 'text-gray-500'}`}
            >
              <UserPlus size={16} /> Create New
            </button>
          </div>
        }
      />

      {/* --- TAB 1: PENDING REQUESTS --- */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Email</th>
                <th className="p-4 border-b">Role Requested</th>
                <th className="p-4 border-b">Date</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">No pending approvals found.</td></tr>
              ) : (
                pendingUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'ngo_admin' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleAction(user._id, 'approve')} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                        <Check size={18} />
                      </button>
                      <button onClick={() => handleAction(user._id, 'reject')} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 2: CREATE NEW USER --- */}
      {activeTab === 'create' && (
        <div className="bg-white max-w-2xl mx-auto rounded-xl shadow-sm border border-gray-100 p-8">
          
          {/* SUCCESS MESSAGE CARD (Only shows after creation) */}
          {createdUser ? (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-green-800">Account Created Successfully!</h3>
              <p className="text-green-700 mb-6">You can share these credentials with the user.</p>
              
              <div className="bg-white p-4 rounded-lg border border-green-100 text-left space-y-2 relative">
                <p><span className="font-bold text-gray-500 text-xs uppercase">Email:</span> <br/> <span className="font-medium text-gray-800">{createdUser.email}</span></p>
                <p><span className="font-bold text-gray-500 text-xs uppercase">Password:</span> <br/> <span className="font-medium text-gray-800">{createdUser.password}</span></p>
                <p><span className="font-bold text-gray-500 text-xs uppercase">Role:</span> <br/> <span className="font-medium text-gray-800">{createdUser.role}</span></p>
              </div>

              <button 
                onClick={() => setCreatedUser(null)}
                className="mt-6 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Create Another User
              </button>
            </div>
          ) : (
            <>
              {/* NORMAL FORM */}
              <div className="mb-6 text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Manually Onboard User</h3>
                <p className="text-sm text-gray-500">Create a pre-verified account for an authority or NGO.</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                    <input 
                      type="email" required 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, role: 'local_authority'})}
                      className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.role === 'local_authority' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100'}`}
                    >
                      <Shield size={24} />
                      <span className="font-bold text-sm">Authority</span>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, role: 'ngo_admin'})}
                      className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.role === 'ngo_admin' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100'}`}
                    >
                      <Building2 size={24} />
                      <span className="font-bold text-sm">NGO Admin</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                  <input 
                    type="text" required 
                    placeholder="Create password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button type="submit" className="w-full bg-[#0f4c75] hover:bg-[#0b3a5b] text-white font-bold py-3 rounded-xl transition-all shadow-lg">
                  Create Account
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;