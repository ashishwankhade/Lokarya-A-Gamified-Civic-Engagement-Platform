/**
 * NgoManagement.jsx
 * Path: src/dashboards/admin/NgoManagement.jsx
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Search, CheckCircle2, XCircle,
  Loader2, ListChecks, CalendarDays, ShieldOff, Shield,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';

const NV = '#0f2c4a';
const V  = '#7c3aed';
const G  = '#059669';

const NgoManagement = () => {
  const [ngos,   setNgos]   = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | suspended
  const [loading,setLoading]= useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter !== 'all') params.set('status', filter);
      const { data } = await api.get(`/admin/ngos?${params}`);
      setNgos(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load NGOs'); }
    finally  { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (ngo) => {
    setActing(ngo._id);
    try {
      const action = ngo.banned ? 'unsuspend' : 'suspend';
      const { data } = await api.patch(`/admin/ngos/${ngo._id}/status`, { action });
      toast.success(data.message);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally     { setActing(null); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:24, color:NV }}>NGO Accounts</h2>
          <p style={{ color:'#64748b', fontSize:14 }}>{ngos.length} organisations registered</p>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, org…"
            style={{ width:'100%', padding:'11px 14px 11px 36px', borderRadius:12, border:'2px solid #e2e8f0',
              fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', color:NV }}
            onFocus={e => e.target.style.borderColor = V}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}/>
        </div>
        {['all','active','suspended'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'9px 16px', borderRadius:10, cursor:'pointer',
              fontWeight:800, fontSize:12, fontFamily:"'DM Sans',sans-serif",
              border: filter===f ? 'none' : '2px solid #e2e8f0',
              background: filter===f ? NV : '#fff',
              color: filter===f ? '#fff' : '#64748b',
              textTransform:'capitalize', transition:'all 0.15s' }}>
            {f}
          </button>
        ))}
      </div>

      {/* CARDS */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'60px 0', color:'#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" style={{ color:V }}/>
          <span style={{ fontWeight:700 }}>Loading NGOs…</span>
        </div>
      ) : ngos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', background:'#fff',
          borderRadius:20, border:'2px dashed #e2e8f0' }}>
          <Building2 size={40} style={{ color:'#e2e8f0', margin:'0 auto 14px' }}/>
          <p style={{ color:'#94a3b8', fontWeight:700 }}>No NGOs found.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {ngos.map((ngo, i) => {
            const initials = ngo.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'N';
            const isBusy   = acting === ngo._id;
            const s        = ngo.activityStats || {};

            return (
              <motion.div key={ngo._id}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background:'#fff', borderRadius:18, border:'2px solid #f0ebe3',
                  boxShadow:'0 2px 10px rgba(0,0,0,0.04)', padding:'20px 22px' }}>

                {/* top */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
                  <div style={{ width:46, height:46, borderRadius:13, flexShrink:0,
                    background: ngo.banned
                      ? '#fee2e2'
                      : 'linear-gradient(135deg,#059669,#047857)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    overflow:'hidden' }}>
                    {ngo.logo
                      ? <img src={ngo.logo} alt={ngo.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <span style={{ color:'#fff', fontWeight:900, fontSize:16 }}>{initials}</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:15, color: ngo.banned ? '#dc2626' : NV,
                      display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      {ngo.organizationName || ngo.name}
                      {ngo.banned
                        ? <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:999,
                            padding:'2px 8px', fontSize:10, fontWeight:800 }}>SUSPENDED</span>
                        : <span style={{ background:'#ecfdf5', color:'#059669', borderRadius:999,
                            padding:'2px 8px', fontSize:10, fontWeight:800 }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{ngo.email}</div>
                  </div>
                </div>

                {/* stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { label:'Total', value:s.total||0,         icon:ListChecks  },
                    { label:'Done',  value:s.completed||0,     icon:CheckCircle2 },
                    { label:'Queued',value:s.pendingApproval||0,icon:CalendarDays },
                  ].map((m,j) => (
                    <div key={j} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                      <m.icon size={14} style={{ color:'#94a3b8', margin:'0 auto 4px', display:'block' }}/>
                      <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:18, color:NV }}>{m.value}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* action */}
                <button onClick={() => handleToggle(ngo)} disabled={isBusy}
                  style={{ width:'100%', padding:'10px', borderRadius:12, border:'none', cursor:'pointer',
                    background: ngo.banned ? '#ecfdf5' : '#fee2e2',
                    color:      ngo.banned ? '#059669' : '#dc2626',
                    fontWeight:800, fontSize:13, fontFamily:"'DM Sans',sans-serif",
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    opacity: isBusy ? 0.6 : 1, transition:'opacity 0.2s' }}>
                  {isBusy
                    ? <Loader2 size={14} className="animate-spin"/>
                    : ngo.banned ? <Shield size={14}/> : <ShieldOff size={14}/>}
                  {ngo.banned ? 'Reinstate NGO' : 'Suspend NGO'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NgoManagement;
