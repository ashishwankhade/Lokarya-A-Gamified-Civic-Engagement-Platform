// src/dashboards/authority/FieldWorkerManager.jsx — light theme
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Trash2, Phone, Briefcase, Users } from 'lucide-react';
import api from '../../api/axios';

const Field = ({ label, value, onChange, placeholder, type='text' }) => (
  <div style={{ marginBottom:12 }}>
    <label style={{ color:'#64748b', fontSize:11, fontWeight:700, display:'block', marginBottom:4 }}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'100%', padding:'9px 12px', borderRadius:9, background:'#f8fafc',
        border:'1px solid #e2e8f0', color:'#0f172a', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
  </div>
);

const EMPTY = { name:'', employeeId:'', phone:'', vibhag:'' };

const FieldWorkerManager = () => {
  const [workers,    setWorkers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/field-workers').then(({ data }) => setWorkers(data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    try { await api.post('/field-workers', form); setForm(EMPTY); setShowForm(false); load(); }
    catch(e) { console.error(e); } finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    setDeleting(id);
    try { await api.delete(`/field-workers/${id}`); load(); }
    catch(e) { console.error(e); } finally { setDeleting(null); }
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", maxWidth:820 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <h2 style={{ color:'#0f172a', fontWeight:900, fontSize:15 }}>Field Workers</h2>
          <p style={{ color:'#94a3b8', fontSize:12, marginTop:2 }}>{workers.length} staff registered</p>
        </div>
        <button onClick={() => setShowForm(v=>!v)}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10,
            background: showForm ? '#f1f5f9' : '#2563eb', color: showForm ? '#64748b' : '#fff',
            border:'none', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            boxShadow: showForm ? 'none' : '0 2px 8px rgba(37,99,235,0.3)' }}>
          {showForm ? <X size={14}/> : <Plus size={14}/>}
          {showForm ? 'Cancel' : 'Add Worker'}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', marginBottom:18 }}>
            <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ color:'#94a3b8', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:16 }}>New Field Worker</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }} className="sm:grid-cols-2">
                <Field label="Full Name"         value={form.name}       onChange={v=>setForm(p=>({...p,name:v}))}       placeholder="Ramesh Patil"/>
                <Field label="Employee ID"       value={form.employeeId} onChange={v=>setForm(p=>({...p,employeeId:v}))} placeholder="LKY-W-001"/>
                <Field label="Phone (WhatsApp)"  value={form.phone}      onChange={v=>setForm(p=>({...p,phone:v}))}      placeholder="+91 9876543210" type="tel"/>
                <Field label="Vibhag"            value={form.vibhag}     onChange={v=>setForm(p=>({...p,vibhag:v}))}     placeholder="Dharampeth"/>
              </div>
              <button onClick={create} disabled={submitting||!form.name.trim()||!form.phone.trim()}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9,
                  background: submitting||!form.name.trim() ? '#f1f5f9' : '#2563eb',
                  color:      submitting||!form.name.trim() ? '#94a3b8' : '#fff',
                  border:'none', fontSize:13, fontWeight:800,
                  cursor: submitting||!form.name.trim() ? 'not-allowed' : 'pointer',
                  fontFamily:"'DM Sans',sans-serif" }}>
                {submitting && <Loader2 size={13} className="animate-spin"/>} Create Worker
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#94a3b8' }}>
          <Loader2 size={18} className="animate-spin" style={{ color:'#2563eb' }}/> <span>Loading…</span>
        </div>
      ) : workers.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
          <Users size={32} style={{ color:'#e2e8f0', margin:'0 auto 10px' }}/>
          <p style={{ color:'#94a3b8', fontSize:14, fontWeight:700 }}>No field workers yet</p>
          <p style={{ color:'#cbd5e1', fontSize:12, marginTop:3 }}>Add your first worker above</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:14 }}>
          <AnimatePresence>
            {workers.map((w,i) => (
              <motion.div key={w._id} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.04 }}
                style={{ background:'#fff', borderRadius:14, padding:18, border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:38, height:38, borderRadius:999, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                      display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>
                      {w.name[0]}
                    </div>
                    <div>
                      <p style={{ color:'#0f172a', fontWeight:700, fontSize:14, lineHeight:1.3 }}>{w.name}</p>
                      <p style={{ color:'#94a3b8', fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>{w.employeeId||'—'}</p>
                    </div>
                  </div>
                  <button onClick={() => remove(w._id)} disabled={deleting===w._id}
                    style={{ color:'#cbd5e1', cursor:'pointer', background:'none', border:'none', padding:4, borderRadius:6 }}
                    onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#cbd5e1'}>
                    {deleting===w._id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                  </button>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Phone size={11} style={{ color:'#94a3b8', flexShrink:0 }}/>
                    <span style={{ color:'#64748b', fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>{w.phone}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Briefcase size={11} style={{ color:'#94a3b8', flexShrink:0 }}/>
                    <span style={{ color:'#64748b', fontSize:12 }}>{w.vibhag||'—'}</span>
                  </div>
                </div>

                <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #f1f5f9',
                  display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'#94a3b8', fontSize:11 }}>Active cases</span>
                  <span style={{ fontWeight:800, fontSize:14,
                    color:(w.activeComplaints?.length||0)>3?'#dc2626':'#059669' }}>
                    {w.activeComplaints?.length||0}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FieldWorkerManager;
