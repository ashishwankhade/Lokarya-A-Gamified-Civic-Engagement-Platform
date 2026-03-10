// src/dashboards/authority/MapView.jsx — light theme
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Layers, X, ChevronRight, Flame, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../../api/axios';

const STATUS_COLOR = {
  pending:'#f59e0b', officer_assigned:'#0369a1', worker_assigned:'#7c3aed',
  in_progress:'#2563eb', resolved:'#059669', closed:'#64748b', escalated:'#dc2626',
};

const CAT_ICON = { Garbage:'🗑️', Roads:'🚧', Water:'💧', Electricity:'⚡', Traffic:'🚗', Other:'📋' };

const FILTERS = [
  { id:'all',       label:'All',       color:'#0f172a' },
  { id:'pending',   label:'Pending',   color:'#d97706' },
  { id:'active',    label:'Active',    color:'#2563eb' },
  { id:'resolved',  label:'Resolved',  color:'#059669' },
  { id:'escalated', label:'Escalated', color:'#dc2626' },
];

const NAGPUR = [21.1458, 79.0882];

const FitBounds = ({ complaints }) => {
  const map = useMap();
  useEffect(() => {
    const v = complaints.filter(c => c.location?.lat && c.location?.lng);
    if (!v.length) return;
    if (v.length === 1) { map.setView([v[0].location.lat, v[0].location.lng], 14); return; }
    map.fitBounds([
      [Math.min(...v.map(c=>c.location.lat)), Math.min(...v.map(c=>c.location.lng))],
      [Math.max(...v.map(c=>c.location.lat)), Math.max(...v.map(c=>c.location.lng))],
    ], { padding:[40,40] });
  }, [complaints]);
  return null;
};

const PopupCard = ({ c, onSelect }) => {
  const color = STATUS_COLOR[c.status] || '#f59e0b';
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minWidth:200 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <span style={{ fontSize:18 }}>{CAT_ICON[c.category]||'📋'}</span>
        <div>
          <p style={{ fontWeight:800, fontSize:13, color:'#0f172a', lineHeight:1.3 }}>{c.title||`${c.category} Issue`}</p>
          <p style={{ fontSize:10, color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>{c.ticketId}</p>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{ background:`${color}18`, color, border:`1px solid ${color}40`,
          borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:800, textTransform:'capitalize' }}>
          {c.status.replace(/_/g,' ')}
        </span>
        <button onClick={() => onSelect(c._id)}
          style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:6,
            padding:'4px 10px', fontSize:11, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          View <ChevronRight size={11}/>
        </button>
      </div>
      {c.slaBreached && (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6, background:'#fef2f2', borderRadius:6, padding:'4px 8px' }}>
          <Flame size={11} style={{ color:'#dc2626' }}/> <span style={{ color:'#dc2626', fontSize:10, fontWeight:700 }}>SLA Breached</span>
        </div>
      )}
      {c.vibhag && <p style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>📍 {c.vibhag}</p>}
    </div>
  );
};

const MapView = ({ onSelect }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    api.get('/complaints').then(({ data }) => setComplaints(data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = complaints.filter(c => {
    if (!c.location?.lat || !c.location?.lng) return false;
    if (filter === 'all')      return true;
    if (filter === 'active')   return ['officer_assigned','worker_assigned','worker_accepted','in_progress'].includes(c.status);
    if (filter === 'resolved') return ['resolved','closed'].includes(c.status);
    return c.status === filter;
  });

  const counts = {
    pending:  complaints.filter(c=>c.status==='pending').length,
    active:   complaints.filter(c=>['officer_assigned','worker_assigned','in_progress'].includes(c.status)).length,
    resolved: complaints.filter(c=>['resolved','closed'].includes(c.status)).length,
    escalated:complaints.filter(c=>c.status==='escalated').length,
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400, gap:10, color:'#94a3b8' }}>
      <Loader2 size={20} className="animate-spin" style={{ color:'#2563eb' }}/> <span>Loading map…</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column', gap:14 }}>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ color:'#0f172a', fontWeight:900, fontSize:15 }}>Complaint Map</h2>
          <p style={{ color:'#94a3b8', fontSize:12, marginTop:2 }}>{filtered.length} complaint{filtered.length!==1?'s':''} with location</p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {FILTERS.map(f => {
            const on = filter===f.id;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                  background: on ? `${f.color}15` : '#fff',
                  border:     on ? `1px solid ${f.color}40` : '1px solid #e2e8f0',
                  color:      on ? f.color : '#64748b',
                  fontFamily:"'DM Sans',sans-serif" }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div style={{ position:'relative', borderRadius:14, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <MapContainer center={NAGPUR} zoom={12} style={{ height:520, width:'100%' }} zoomControl>
          {/* Light tile — OpenStreetMap via Carto Positron, no API key */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds complaints={filtered}/>
          {filtered.map(c => {
            const color  = c.slaBreached ? '#dc2626' : STATUS_COLOR[c.status] || '#f59e0b';
            return (
              <CircleMarker key={c._id} center={[c.location.lat, c.location.lng]}
                radius={c.slaBreached ? 11 : 9}
                pathOptions={{ fillColor:color, fillOpacity:0.85, color:'#fff', weight:2, opacity:1 }}>
                <Popup closeButton={false}><PopupCard c={c} onSelect={onSelect}/></Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <AnimatePresence>
          {showLegend && (
            <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }}
              style={{ position:'absolute', top:12, right:12, zIndex:999,
                background:'rgba(255,255,255,0.96)', backdropFilter:'blur(8px)',
                border:'1px solid #e2e8f0', borderRadius:12, padding:'12px 14px',
                boxShadow:'0 4px 16px rgba(0,0,0,0.08)', minWidth:150 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ color:'#94a3b8', fontSize:10, fontWeight:800, letterSpacing:'0.07em' }}>LEGEND</span>
                <button onClick={() => setShowLegend(false)} style={{ color:'#94a3b8', cursor:'pointer', background:'none', border:'none', padding:0 }}>
                  <X size={13}/>
                </button>
              </div>
              {[
                { color:'#f59e0b', label:'Pending',        count:counts.pending },
                { color:'#2563eb', label:'Active',         count:counts.active },
                { color:'#059669', label:'Resolved',       count:counts.resolved },
                { color:'#dc2626', label:'Escalated/Breach',count:counts.escalated },
              ].map((l,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:i<3?6:0 }}>
                  <div style={{ width:10, height:10, borderRadius:999, background:l.color, flexShrink:0 }}/>
                  <span style={{ color:'#475569', fontSize:11 }}>{l.label}</span>
                  <span style={{ color:'#94a3b8', fontSize:11, marginLeft:'auto' }}>({l.count})</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!showLegend && (
          <button onClick={() => setShowLegend(true)}
            style={{ position:'absolute', top:12, right:12, zIndex:999,
              background:'rgba(255,255,255,0.95)', border:'1px solid #e2e8f0', borderRadius:9,
              padding:'6px 11px', cursor:'pointer', color:'#64748b', fontSize:11, fontWeight:700,
              display:'flex', alignItems:'center', gap:5, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <Layers size={13}/> Legend
          </button>
        )}

        {filtered.length === 0 && (
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:999,
            background:'rgba(255,255,255,0.95)', border:'1px solid #e2e8f0', borderRadius:12,
            padding:'16px 24px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ color:'#94a3b8', fontSize:13, fontWeight:700 }}>No complaints with location data</p>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        .leaflet-popup-content-wrapper { border-radius:12px!important; padding:0!important; box-shadow:0 8px 24px rgba(0,0,0,0.1)!important; border:1px solid #e2e8f0!important; }
        .leaflet-popup-content { margin:12px 14px!important; }
        .leaflet-control-zoom a { background:#fff!important; color:#475569!important; border-color:#e2e8f0!important; }
        .leaflet-control-zoom a:hover { background:#f8fafc!important; }
        .leaflet-control-attribution { background:rgba(255,255,255,0.85)!important; color:#94a3b8!important; font-size:9px!important; }
      `}</style>
    </div>
  );
};

export default MapView;
