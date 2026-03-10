/**
 * ComplaintPage.jsx  — REFACTORED
 * Uses shared components from src/components/shared/lokarya-ui.jsx
 *
 * Removed ~140 lines of duplicated code:
 *   WaveDown, GrassEdge, GlobalStyles, StickyTabBar, GuestBanner,
 *   ImpactStats, CTABanner, CommunityStrip, LoadingState, EmptyState,
 *   LockedState, StepCard, TIERS / getTier / getNextTier / getProgress,
 *   imgUrl — all imported from shared.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, MapPin, CheckCircle, Clock, Zap,
  ChevronDown, User, ArrowRight, Image as ImageIcon,
  Loader2, AlertCircle, Phone, Navigation, X,
  Building2, Target, Lock, Star, Flag,
  FileText, Wrench, UserPlus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useLoginGate, { LoginGate } from '../hooks/useLoginGate';

import {
  NV, OR, FF, SF, BG,
  imgUrl, TIERS, getTier, getNextTier, getProgress,
  GlobalStyles,
  StickyTabBar, GuestBanner, HowToSection,
  ImpactStatsSection, CTABanner, CommunityStrip,
  LoadingState, EmptyState, LockedState,
  StatPill, PageHeroShell,
} from '../components/shared/lokarya-ui';

/* ─── Complaint-specific timeline config ────────────────────────── */
const STEP_COLOR = {
  pending:'#d97706', officer_assigned:'#0369a1', worker_assigned:'#7c3aed',
  worker_accepted:'#7c3aed', in_progress:'#2563eb', resolved:'#059669',
  closed:'#64748b', escalated:'#dc2626',
};
const STEP_BG = {
  pending:'#fef3c7', officer_assigned:'#e0f2fe', worker_assigned:'#ede9fe',
  worker_accepted:'#ede9fe', in_progress:'#dbeafe', resolved:'#d1fae5',
  closed:'#f1f5f9', escalated:'#fee2e2',
};
const stepIcon = (status) => {
  if (status === 'resolved' || status === 'closed') return CheckCircle;
  if (status === 'escalated') return AlertCircle;
  if (status === 'officer_assigned') return UserPlus;
  if (['worker_assigned','worker_accepted','in_progress'].includes(status)) return Wrench;
  return Clock;
};

/* ─── Constants ─────────────────────────────────────────────────── */
const CATEGORIES = [
  { id:'Garbage',     label:'Garbage',  icon:'🗑️' },
  { id:'Roads',       label:'Roads',    icon:'🚧' },
  { id:'Water',       label:'Water',    icon:'💧' },
  { id:'Electricity', label:'Electric', icon:'⚡' },
  { id:'Traffic',     label:'Traffic',  icon:'🚗' },
  { id:'Other',       label:'Other',    icon:'📋' },
];
const VIBHAG_OPTIONS = [
  'Dharampeth','Dhantoli','Nehru Nagar','Gandhi Nagar',
  'Hanuman Nagar','Mangalwari','Ashi Nagar','Satranjipura',
  'Lakadganj','East Nagpur','West Nagpur','South Nagpur','North Nagpur','Other',
];
const STATUS_CONFIG = {
  pending:          { color:'#dc2626', bg:'#fef2f2', label:'Pending'          },
  under_review:     { color:'#d97706', bg:'#fffbeb', label:'Under Review'     },
  officer_assigned: { color:'#2563eb', bg:'#eff6ff', label:'Officer Assigned' },
  worker_assigned:  { color:'#7c3aed', bg:'#f5f3ff', label:'Worker Assigned'  },
  in_progress:      { color:'#7c3aed', bg:'#f5f3ff', label:'In Progress'      },
  resolved:         { color:'#059669', bg:'#ecfdf5', label:'Resolved'         },
  closed:           { color:'#64748b', bg:'#f8fafc', label:'Closed'           },
  escalated:        { color:'#dc2626', bg:'#fef2f2', label:'Escalated'        },
};

const HOW_STEPS = [
  { n:'01', t:'Pin Your Location',  d:'Open the map, drop a pin on the exact spot. GPS auto-detects your address and Vibhag ward instantly.' },
  { n:'02', t:'Describe the Issue', d:'Select a category, write a description, and optionally attach a photo for stronger evidence.' },
  { n:'03', t:'Earn XP & Track It', d:'Submit and earn +10 XP. An officer gets assigned and you can track every status update in real-time.' },
];
const IMPACT_STATS = [
  { e:'🗺️', v:'380+',   l:'Issues Resolved',    t:'Across all Vibhags', d:'Complaints across all 19 vibhags resolved through citizen-authority collaboration.' },
  { e:'⚡', v:'2,400+', l:'Active Citizens',     t:'Earning XP daily',   d:'Citizens earn XP filing complaints, attending missions, and verifying duplicate reports.' },
  { e:'⏱️', v:'48h',    l:'Avg Resolution Time', t:'Fast turnaround',    d:'Most complaints are acknowledged within 24 hours and resolved within 48 hours on average.' },
];

/* ═══════════════════════════════════════════════════════════════════
   MAP PANEL  (complaint-specific, not shared)
═══════════════════════════════════════════════════════════════════ */
const MapPanel = ({ onConfirm, onClose }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const [ready,setReady]       = useState(false);
  const [locating,setLocating] = useState(true);
  const [geocoding,setGeocoding] = useState(false);
  const [pinned,setPinned]     = useState(null);

  useEffect(()=>{
    if(!document.getElementById('lf-css')){
      const l=document.createElement('link'); l.id='lf-css'; l.rel='stylesheet';
      l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l);
    }
    import('leaflet').then(mod=>{
      const L=mod.default; delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });
      window.__LK=L; setReady(true);
    });
  },[]);

  useEffect(()=>{
    if(!ready||!containerRef.current||mapRef.current) return;
    const initMap=(lat,lng)=>{
      const L=window.__LK;
      const map=L.map(containerRef.current,{center:[lat,lng],zoom:16,zoomControl:false});
      L.control.zoom({position:'bottomright'}).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
      const icon=L.divIcon({ className:'', html:`<div style="position:relative;width:44px;height:44px"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(244,124,32,.18);animation:pulse-ring 2s ease-in-out infinite"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:${OR};border:3px solid #fff;box-shadow:0 3px 12px rgba(244,124,32,.4)"></div></div>`, iconSize:[44,44],iconAnchor:[22,22] });
      const marker=L.marker([lat,lng],{draggable:true,icon}).addTo(map);
      marker.on('dragend',e=>{ const{lat:la,lng:lo}=e.target.getLatLng(); geocode(la,lo); });
      mapRef.current=map; markerRef.current=marker; geocode(lat,lng); setLocating(false);
    };
    const fallback=()=>initMap(21.1458,79.0882);
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>initMap(p.coords.latitude,p.coords.longitude),fallback,{timeout:8000,enableHighAccuracy:true});
    else fallback();
    return()=>{ mapRef.current?.remove(); mapRef.current=null; };
  },[ready]);

  const geocode=async(lat,lng)=>{
    setGeocoding(true);
    try{
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,{headers:{'Accept-Language':'en'}});
      const data=await res.json(); const a=data.address||{};
      const address=[a.road,a.neighbourhood,a.suburb,a.city||a.town||'Nagpur',a.postcode].filter(Boolean).join(', ');
      const hay=[a.suburb,a.neighbourhood,a.quarter,a.village].filter(Boolean).join(' ').toLowerCase();
      const vibhag=VIBHAG_OPTIONS.find(v=>hay.includes(v.toLowerCase()))||'';
      setPinned({lat,lng,address,vibhag});
    } catch { setPinned({lat,lng,address:`${lat.toFixed(5)}, ${lng.toFixed(5)}`,vibhag:''}); }
    finally { setGeocoding(false); }
  };

  const recenter=()=>{
    if(!navigator.geolocation||!mapRef.current) return; setLocating(true);
    navigator.geolocation.getCurrentPosition(p=>{ const{latitude:la,longitude:lo}=p.coords; mapRef.current.setView([la,lo],17); markerRef.current?.setLatLng([la,lo]); geocode(la,lo); setLocating(false); },()=>setLocating(false),{timeout:6000});
  };

  return (
    <motion.div initial={{opacity:0,x:32,scale:0.97}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:32,scale:0.97}} transition={{type:'spring',stiffness:280,damping:26}}
      style={{display:'flex',flexDirection:'column',background:'#fff',borderRadius:22,border:'2px solid #f0ebe3',boxShadow:'0 8px 32px rgba(15,44,74,0.10)',overflow:'hidden',minHeight:520,fontFamily:FF}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #f1f5f9',flexShrink:0,background:NV}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:10,background:'rgba(244,124,32,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><MapPin size={16} style={{color:OR}}/></div>
          <div><p style={{fontSize:13,fontWeight:800,color:'#fff',lineHeight:1.2}}>Drop Pin</p><p style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:1}}>Drag marker · auto-fills form</p></div>
        </div>
        <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.12)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}><X size={14} style={{color:'#fff'}}/></button>
      </div>
      <div style={{position:'relative',flex:1,minHeight:280}}>
        <AnimatePresence>
          {(locating||!ready)&&(
            <motion.div initial={{opacity:1}} exit={{opacity:0}} style={{position:'absolute',inset:0,zIndex:20,background:'#f8fafc',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
              <div style={{position:'relative'}}><div style={{width:48,height:48,borderRadius:'50%',border:`4px solid #f0ebe3`,borderTop:`4px solid ${OR}`,animation:'spin 1s linear infinite'}}/><Navigation size={18} style={{position:'absolute',inset:0,margin:'auto',color:OR}}/></div>
              <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.05em'}}>Detecting location…</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={containerRef} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
        <button onClick={recenter} title="Back to my location" style={{position:'absolute',bottom:52,right:10,zIndex:500,width:36,height:36,background:'#fff',borderRadius:'50%',border:'1.5px solid #f0ebe3',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          {locating?<Loader2 size={15} style={{color:OR,animation:'spin 1s linear infinite'}}/>:<Navigation size={15} style={{color:OR}}/>}
        </button>
      </div>
      <div style={{padding:'14px 20px',background:'#fafafa',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
        {geocoding?(<div style={{display:'flex',alignItems:'center',gap:8}}><Loader2 size={12} style={{color:OR,animation:'spin 1s linear infinite'}}/><span style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>Looking up address…</span></div>)
        :pinned?(<><p style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Detected Address</p><p style={{fontSize:13,fontWeight:700,color:NV,lineHeight:1.5}}>{pinned.address}</p><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}><p style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace'}}>{pinned.lat.toFixed(5)}, {pinned.lng.toFixed(5)}</p>{pinned.vibhag&&<span style={{fontSize:10,fontWeight:800,color:'#059669',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:999,padding:'2px 10px'}}>{pinned.vibhag}</span>}</div></>)
        :(<p style={{fontSize:12,color:'#94a3b8'}}>Move the pin to detect address</p>)}
      </div>
      <div style={{padding:'14px 20px 20px',flexShrink:0}}>
        <button onClick={()=>pinned&&!geocoding&&onConfirm(pinned)} disabled={!pinned||geocoding}
          style={{width:'100%',padding:'13px',borderRadius:14,border:'none',background:(!pinned||geocoding)?'#f1f5f9':OR,color:(!pinned||geocoding)?'#94a3b8':'#fff',fontFamily:FF,fontWeight:900,fontSize:14,cursor:(!pinned||geocoding)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:(!pinned||geocoding)?'none':`0 4px 16px ${OR}45`,transition:'all 0.2s'}}>
          <CheckCircle size={16}/> Confirm Location
        </button>
      </div>
    </motion.div>
  );
};

/* ─── Map Placeholder ───────────────────────────────────────────── */
const MapPlaceholder = ({ hasCoords, address, coords, onOpen }) => (
  <motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onOpen}
    style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#fff',borderRadius:22,border:hasCoords?'2px solid #a7f3d0':'2px dashed #e2e8f0',padding:'48px 32px',textAlign:'center',cursor:'pointer',minHeight:420,fontFamily:FF,transition:'all 0.25s'}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=OR;e.currentTarget.style.background='#fff9f5';}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=hasCoords?'#a7f3d0':'#e2e8f0';e.currentTarget.style.background='#fff';}}>
    <div style={{width:72,height:72,borderRadius:22,marginBottom:20,background:hasCoords?'#ecfdf5':'#fff5ee',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:hasCoords?'0 0 0 8px #ecfdf550':'0 0 0 8px #fff5ee80'}}>
      {hasCoords?<CheckCircle size={32} style={{color:'#059669'}}/>:<MapPin size={32} style={{color:OR}}/>}
    </div>
    {hasCoords?(
      <><p style={{fontFamily:SF,fontWeight:900,fontSize:18,color:NV,marginBottom:6}}>Location Pinned ✓</p><p style={{fontSize:12,color:'#64748b',lineHeight:1.7,maxWidth:220,marginBottom:6}}>{address}</p><p style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace',marginBottom:20}}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p><span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:800,color:OR,background:'#fff5ee',border:`1.5px solid ${OR}30`,borderRadius:12,padding:'8px 18px'}}><MapPin size={13}/> Change Location</span></>
    ):(
      <><p style={{fontFamily:SF,fontWeight:900,fontSize:20,color:NV,marginBottom:8}}>Pin Your Location</p><p style={{fontSize:13,color:'#64748b',lineHeight:1.75,maxWidth:220,marginBottom:28}}>GPS detects your location and auto-fills address and Vibhag instantly.</p><span style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:14,fontWeight:900,color:'#fff',background:OR,borderRadius:14,padding:'12px 28px',boxShadow:`0 4px 16px ${OR}45`}}><Target size={15}/> Open Map</span></>
    )}
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
const ComplaintPage = () => {
  const { isLoggedIn, user }        = useAuth();
  const { requireLogin, gateProps } = useLoginGate();

  const [activeTab,    setActiveTab]    = useState('new');
  const [expandedId,   setExpandedId]   = useState(null);
  const [showMap,      setShowMap]      = useState(false);
  const [formData,     setFormData]     = useState({ category:'',desc:'',address:'',vibhag:'',image:null });
  const [coords,       setCoords]       = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myComplaints,     setMyComplaints]     = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [ratingTarget,     setRatingTarget]     = useState(null);
  const [ratingValue,      setRatingValue]      = useState(0);
  const [ratingLoading,    setRatingLoading]    = useState(false);

  const formRef  = useRef(null);
  const xp       = user?.xp || 0;
  const tier     = getTier(xp);
  const TierIcon = tier.Icon;

  const handleRate = async (complaintId, rating) => {
    setRatingLoading(true);
    try {
      await api.patch(`/complaints/${complaintId}/rate`, { rating });
      toast.success(rating >= 4 ? '✅ Thanks! Complaint closed. +5 XP earned.' : '⚠️ Escalated for re-review.');
      setRatingTarget(null); setRatingValue(0);
      const { data } = await api.get('/complaints/my'); setMyComplaints(data);
    } catch(err) { toast.error(err.response?.data?.message || 'Rating failed.'); }
    finally { setRatingLoading(false); }
  };

  const handleMapConfirm = useCallback(({ lat, lng, address, vibhag }) => {
    setCoords({ lat, lng });
    setFormData(prev => ({ ...prev, address: address || prev.address, vibhag: vibhag || prev.vibhag }));
    setShowMap(false); toast.success('📍 Location confirmed!');
  }, []);

  const handleImage = e => { const file=e.target.files[0]; if(file){ setFormData(prev=>({...prev,image:file})); setPreview(URL.createObjectURL(file)); }};
  const setField = key => e => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!isLoggedIn)        { requireLogin(); return; }
    if (!formData.category) { toast.warning('Please select an issue type.'); return; }
    if (!formData.address)  { toast.warning('Please enter an address.'); return; }
    if (!formData.vibhag)   { toast.warning('Please select a Vibhag.'); return; }
    if (!formData.desc)     { toast.warning('Please describe the issue.'); return; }
    if (!coords)            { toast.warning('Please pin your location on the map first.'); return; }
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', `${formData.category} Report`);
      data.append('description', formData.desc);
      data.append('category', formData.category);
      data.append('vibhag', formData.vibhag);
      data.append('location', JSON.stringify({ address: formData.address, lat: Number(coords.lat), lng: Number(coords.lng) }));
      if (formData.image) data.append('image', formData.image);
      await api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('✅ Complaint submitted! +10 XP earned.');
      setFormData({ category:'',desc:'',address:'',vibhag:'',image:null });
      setPreview(null); setCoords(null); setShowMap(false); setActiveTab('track');
    } catch(error) { toast.error(error.response?.data?.message || 'Submission failed.'); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    if (activeTab !== 'track' || !isLoggedIn) return;
    const load = async () => {
      setIsLoadingHistory(true);
      try { const { data } = await api.get('/complaints/my'); setMyComplaints(data); }
      catch { toast.error('Failed to load history'); }
      finally { setIsLoadingHistory(false); }
    };
    load();
  }, [activeTab, isLoggedIn]);

  const toggleExpand = id => setExpandedId(expandedId === id ? null : id);
  const inputStyle = { width:'100%',padding:'12px 14px',background:'#f8fafc',border:'1.5px solid #f0ebe3',borderRadius:12,fontFamily:FF,fontSize:13,fontWeight:500,color:NV,transition:'border 0.2s,box-shadow 0.2s',boxSizing:'border-box' };

  return (
    <div className="cp-wrap" style={{ minHeight:'100vh', background:BG, fontFamily:FF }}>
      <GlobalStyles namespace="cp-wrap"/>
      <LoginGate {...gateProps}/>

      {/* HERO */}
      <PageHeroShell badge="Nagpur's Complaint Portal">
        <h1 style={{fontFamily:SF,fontWeight:900,color:'#fff',fontSize:'clamp(44px,7vw,82px)',lineHeight:1.05,marginBottom:18}}>
          Report.<br/><span style={{color:'#fb923c',fontStyle:'italic'}}>Resolve.</span>
        </h1>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:17,lineHeight:1.8,maxWidth:500,margin:'0 auto 36px'}}>
          File civic issues, earn XP for every complaint, and help shape a better Nagpur — one report at a time.
        </p>
        <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:12,marginBottom:44}}>
          <StatPill emoji="📋" value="+10"    label="XP per Report"  />
          <StatPill emoji="⭐" value="+5"     label="XP for Feedback"/>
          <StatPill emoji="🏙️" value="Nagpur" label="Our City"       />
          {isLoggedIn&&<StatPill emoji={<TierIcon size={18} style={{color:tier.color}}/>} value={`${xp} XP`} label={tier.rank} accent/>}
        </div>
        {isLoggedIn&&(()=>{
          const nextTier=getNextTier(xp); const progress=getProgress(xp);
          return (
            <div style={{maxWidth:320,margin:'0 auto 36px',textAlign:'left'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Progress</span>
                <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)'}}>{nextTier?`${nextTier.minXp-xp} XP to ${nextTier.rank}`:'🏆 Max Rank'}</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:999,overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${progress}%`}} transition={{duration:1,ease:'easeOut'}} style={{height:'100%',borderRadius:999,background:`linear-gradient(to right,${tier.bar},${OR})`}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                {TIERS.map(t=><div key={t.level} style={{width:6,height:6,borderRadius:'50%',background:xp>=t.minXp?t.color:'rgba(255,255,255,0.15)',transition:'background 0.3s'}}/>)}
              </div>
            </div>
          );
        })()}
        <button onClick={()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'})} className="ob pring"
          style={{display:'inline-flex',alignItems:'center',gap:10,padding:'14px 30px',borderRadius:14,background:OR,color:'#fff',fontWeight:800,fontSize:15,border:'none',cursor:'pointer',fontFamily:FF,boxShadow:'0 8px 24px rgba(244,124,32,0.35)'}}>
          {isLoggedIn?'File a Complaint':'Get Started'} <ArrowRight size={18}/>
        </button>
      </PageHeroShell>

      {/* STICKY TAB BAR */}
      <StickyTabBar tabs={[{id:'new',label:'📋 Quick Report'},{id:'track',label:'🔍 My Complaints'}]} active={activeTab} onChange={setActiveTab}/>

      {/* GUEST BANNER */}
      {!isLoggedIn&&activeTab==='new'&&<GuestBanner message="Log in to file complaints and earn XP." onLogin={()=>requireLogin()}/>}

      <AnimatePresence mode="wait">

        {activeTab==='new'&&(
          <motion.div key="new" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>

            <section ref={formRef} style={{background:BG,padding:'60px 24px'}}>
              <div style={{maxWidth:1200,margin:'0 auto'}}>
                <div style={{marginBottom:40}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:28,height:3,background:OR,borderRadius:3}}/>
                    <span style={{color:OR,fontWeight:800,fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:FF}}>File Now</span>
                  </div>
                  <h2 style={{fontFamily:SF,fontWeight:900,fontSize:'clamp(26px,4vw,42px)',color:'#0f1c2e',lineHeight:1.2,margin:0}}>
                    Raise a <span style={{color:OR,fontStyle:'italic'}}>complaint</span>
                  </h2>
                </div>

                <div style={{display:'grid',gap:24,gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',alignItems:'start'}}>

                  {/* FORM */}
                  <div style={{position:'relative'}}>
                    {!isLoggedIn&&(
                      <div style={{position:'absolute',inset:0,zIndex:10,borderRadius:22,overflow:'hidden'}}>
                        <div style={{position:'absolute',inset:0,background:'rgba(255,251,245,0.85)',backdropFilter:'blur(4px)',borderRadius:22}}/>
                        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'0 32px',textAlign:'center'}}>
                          <div style={{width:56,height:56,borderRadius:18,background:NV,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 8px 24px ${NV}40`}}><Lock size={26} style={{color:'#fff'}}/></div>
                          <div><p style={{fontFamily:SF,fontWeight:900,fontSize:18,color:NV,marginBottom:6}}>Login to Report an Issue</p><p style={{fontSize:13,color:'#64748b',lineHeight:1.7,maxWidth:260}}>Join Lokarya to file complaints, earn XP, and make Nagpur better.</p></div>
                          <motion.button whileTap={{scale:0.97}} onClick={requireLogin} className="ob pring" style={{display:'flex',alignItems:'center',gap:8,background:OR,color:'#fff',border:'none',borderRadius:14,padding:'13px 28px',fontFamily:FF,fontWeight:900,fontSize:14,cursor:'pointer',boxShadow:`0 4px 16px ${OR}45`}}>Log In / Join Free <ArrowRight size={16}/></motion.button>
                        </div>
                      </div>
                    )}

                    <div style={{background:'#fff',borderRadius:22,border:'2px solid #f0ebe3',padding:'28px',boxShadow:'0 4px 20px rgba(15,44,74,0.06)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
                        <div style={{width:40,height:40,borderRadius:13,background:'#fff5ee',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Zap size={18} fill={OR} style={{color:OR}}/></div>
                        <div><h2 style={{fontFamily:SF,fontWeight:900,fontSize:20,color:NV,lineHeight:1.2}}>Raise a Complaint</h2><p style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginTop:2}}>File an issue · earn +10 XP</p></div>
                      </div>

                      {/* Category */}
                      <div style={{marginBottom:24}}>
                        <label style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.12em',display:'block',marginBottom:12}}>1 · Issue Type</label>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                          {CATEGORIES.map(cat=>(
                            <button key={cat.id} onClick={()=>setFormData(prev=>({...prev,category:cat.id}))}
                              style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 8px',borderRadius:16,cursor:'pointer',border:`2px solid ${formData.category===cat.id?OR:'#f0ebe3'}`,background:formData.category===cat.id?'#fff5ee':'#f8fafc',fontFamily:FF,transition:'all 0.18s',transform:formData.category===cat.id?'scale(1.04)':'scale(1)',boxShadow:formData.category===cat.id?`0 4px 14px ${OR}25`:'none'}}>
                              <span style={{fontSize:22}}>{cat.icon}</span>
                              <span style={{fontSize:10,fontWeight:800,color:formData.category===cat.id?OR:'#64748b'}}>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Location */}
                      <div style={{marginBottom:20}}>
                        <label style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.12em',display:'block',marginBottom:12}}>2 · Location</label>
                        <div style={{position:'relative',marginBottom:10}}>
                          <button onClick={()=>setShowMap(v=>!v)} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:30,height:30,borderRadius:9,border:'none',cursor:'pointer',background:coords?'#ecfdf5':showMap?OR:'#fff5ee',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,transition:'all 0.2s'}}>
                            <MapPin size={14} style={{color:coords?'#059669':showMap?'#fff':OR}}/>
                          </button>
                          <input type="text" placeholder={coords?'Auto-filled — edit if needed':'Click 📍 to open map & detect…'} value={formData.address} onChange={setField('address')} className="lk-input" style={{...inputStyle,paddingLeft:48,paddingRight:coords?60:14}}/>
                          {coords&&<span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:9,fontWeight:800,color:'#059669',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:999,padding:'2px 8px',pointerEvents:'none'}}>GPS ✓</span>}
                        </div>
                        <div style={{position:'relative'}}>
                          <Building2 size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:OR,pointerEvents:'none',zIndex:2}}/>
                          <select value={formData.vibhag} onChange={setField('vibhag')} className="lk-select" style={{...inputStyle,paddingLeft:38,paddingRight:36,appearance:'none',cursor:'pointer'}}>
                            <option value="">Select Vibhag (Ward Division)</option>
                            {VIBHAG_OPTIONS.map(v=><option key={v} value={v}>{v}</option>)}
                          </select>
                          <ChevronDown size={13} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none'}}/>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{marginBottom:20}}>
                        <label style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.12em',display:'block',marginBottom:10}}>3 · Description</label>
                        <textarea value={formData.desc} onChange={setField('desc')} rows={3} placeholder="What's the issue? How severe? When did it start?" className="lk-input" style={{...inputStyle,resize:'none',lineHeight:1.6}}/>
                      </div>

                      {/* Photo */}
                      <div style={{marginBottom:28}}>
                        <label style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.12em',display:'block',marginBottom:10}}>4 · Photo Proof <span style={{textTransform:'none',fontWeight:500,color:'#cbd5e1'}}>(optional)</span></label>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <label style={{flex:1,cursor:'pointer',background:'#f8fafc',border:'2px dashed #f0ebe3',borderRadius:14,height:54,display:'flex',alignItems:'center',justifyContent:'center',gap:8,color:'#94a3b8',fontWeight:700,fontSize:13,transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=OR;e.currentTarget.style.color=OR;}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0ebe3';e.currentTarget.style.color='#94a3b8';}}>
                            <Camera size={17}/> Add Photo
                            <input type="file" style={{display:'none'}} onChange={handleImage} accept="image/*"/>
                          </label>
                          <AnimatePresence>
                            {preview&&(
                              <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}} style={{height:54,width:54,borderRadius:12,overflow:'hidden',border:'2px solid #f0ebe3',position:'relative',flexShrink:0}}>
                                <img src={preview} alt="Evidence" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                <button onClick={()=>{setPreview(null);setFormData(p=>({...p,image:null}));}} style={{position:'absolute',top:0,right:0,background:'#dc2626',color:'#fff',border:'none',width:18,height:18,borderBottomLeftRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <motion.button whileTap={{scale:0.98}} onClick={handleSubmit} disabled={isSubmitting} className="ob"
                        style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:isSubmitting?'#f1f5f9':OR,color:isSubmitting?'#94a3b8':'#fff',fontFamily:FF,fontWeight:900,fontSize:15,cursor:isSubmitting?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:isSubmitting?'none':`0 6px 20px ${OR}40`,transition:'all 0.2s'}}>
                        {isSubmitting?<><Loader2 size={17} style={{animation:'spin 1s linear infinite'}}/> Submitting…</>:<>Submit Complaint <ArrowRight size={17}/></>}
                      </motion.button>
                    </div>
                  </div>

                  {/* MAP */}
                  <div style={{position:'sticky',top:80}}>
                    <AnimatePresence mode="wait">
                      {showMap?<MapPanel key="live-map" onConfirm={handleMapConfirm} onClose={()=>setShowMap(false)}/>:<MapPlaceholder key="placeholder" hasCoords={!!coords} address={formData.address} coords={coords} onOpen={()=>setShowMap(true)}/>}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>

            <HowToSection label="Get Involved" title="How to" accent="file a complaint" steps={HOW_STEPS} image="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=700" imageAlt="Citizen reporting" badge={{emoji:'⚡',value:'+10',label:'XP per report'}}/>
            <ImpactStatsSection title="Resolved" accent="till now" subtitle="Real numbers from Nagpur's civic system." stats={IMPACT_STATS}/>
            <CTABanner title="Your city. Your" accent="voice." subtitle="Every complaint you file brings Nagpur one step closer to the city it deserves to be." ctaLabel="File a Complaint" onCta={()=>{setActiveTab('new');setTimeout(()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),100);}} image="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600" height={340}/>
            <CommunityStrip title="Track every complaint in real-time" subtitle="Switch to My Complaints to see your full history and live status updates." ctaLabel="View My Log" onCta={()=>setActiveTab('track')}/>
          </motion.div>
        )}

        {/* MY COMPLAINTS */}
        {activeTab==='track'&&(
          <motion.div key="track" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} style={{maxWidth:900,margin:'40px auto',padding:'0 24px 80px'}}>

            {!isLoggedIn&&<LockedState title="Your complaint log is private" subtitle="Log in to see your complaints and track status updates." ctaLabel="Log In to View Log" onLogin={()=>requireLogin()}/>}
            {isLoggedIn&&isLoadingHistory&&<LoadingState message="Loading complaints…"/>}
            {isLoggedIn&&!isLoadingHistory&&myComplaints.length===0&&<EmptyState icon={Flag} title="No complaints filed yet" subtitle="Use Quick Report to submit your first complaint."/>}

            {isLoggedIn&&myComplaints.map((item,idx)=>{
              const sc=STATUS_CONFIG[item.status]||STATUS_CONFIG.pending;
              const isExpanded=expandedId===item._id;
              const citizenPhoto=imgUrl(item.image);
              const resolutionPhoto=imgUrl(item.resolutionImage);

              return (
                <motion.div key={item._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:idx*0.05}}
                  style={{background:'#fff',borderRadius:20,border:`2px solid ${isExpanded?OR:'#f0ebe3'}`,marginBottom:12,overflow:'hidden',boxShadow:isExpanded?`0 4px 20px ${OR}18`:'0 2px 8px rgba(15,44,74,0.04)',transition:'all 0.25s',fontFamily:FF}}>

                  {/* Collapsed row */}
                  <div onClick={()=>toggleExpand(item._id)} style={{padding:'18px 20px',display:'flex',alignItems:'center',gap:14,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:46,height:46,borderRadius:14,background:sc.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {['resolved','closed'].includes(item.status)?<CheckCircle size={22} style={{color:sc.color}}/>:<FileText size={20} style={{color:sc.color}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                        <span style={{fontFamily:SF,fontWeight:900,fontSize:15,color:NV}}>{item.category} Issue</span>
                        {item.vibhag&&<span style={{fontSize:10,fontWeight:800,color:'#059669',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:999,padding:'2px 8px'}}>{item.vibhag}</span>}
                        {resolutionPhoto&&!['resolved','closed'].includes(item.status)&&<span style={{fontSize:10,fontWeight:800,color:'#2563eb',background:'#dbeafe',border:'1px solid #bfdbfe',borderRadius:999,padding:'2px 8px'}}>📸 Proof uploaded</span>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:10,color:'#94a3b8',fontFamily:'monospace',fontWeight:600}}>{item.ticketId||`#${item._id.slice(-6).toUpperCase()}`}</span>
                        <span style={{fontSize:10,color:'#cbd5e1'}}>·</span>
                        <span style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>{new Date(item.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:800,color:sc.color,background:sc.bg,border:`1px solid ${sc.color}30`,borderRadius:999,padding:'4px 12px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{sc.label}</span>
                      <ChevronDown size={16} style={{color:'#94a3b8',transform:isExpanded?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s'}}/>
                    </div>
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {isExpanded&&(
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{type:'spring',stiffness:100,damping:20}} style={{overflow:'hidden'}}>
                        <div style={{padding:'0 20px 22px',borderTop:'1px solid #f8fafc'}}>

                          {item.assignedOfficer?.name?(
                            <div style={{background:'#f8fafc',borderRadius:14,border:'1.5px solid #f0ebe3',padding:'14px 16px',display:'flex',alignItems:'center',gap:12,margin:'16px 0'}}>
                              <div style={{width:40,height:40,borderRadius:12,background:'#fff5ee',border:`1.5px solid ${OR}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><User size={18} style={{color:OR}}/></div>
                              <div style={{flex:1}}>
                                <p style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Assigned Officer</p>
                                <p style={{fontWeight:800,fontSize:13,color:NV}}>{item.assignedOfficer.name}</p>
                                <p style={{fontSize:11,color:'#64748b',fontWeight:600,textTransform:'capitalize'}}>{item.assignedOfficer.designation||'Field Staff'}</p>
                              </div>
                              {item.assignedOfficer.contact&&<a href={`tel:${item.assignedOfficer.contact}`} style={{width:36,height:36,borderRadius:10,background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}><Phone size={15} style={{color:'#059669'}}/></a>}
                            </div>
                          ):(
                            <div style={{margin:'16px 0',padding:'14px',background:'#f8fafc',borderRadius:14,border:'1.5px dashed #f0ebe3',textAlign:'center'}}><p style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>Awaiting officer assignment…</p></div>
                          )}

                          {(item.timeline||[]).length>0&&(
                            <div style={{marginBottom:20}}>
                              <p style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}}>Timeline</p>
                              <div style={{display:'flex',flexDirection:'column'}}>
                                {item.timeline.map((step,i)=>{
                                  const isLast=i===item.timeline.length-1;
                                  const color=STEP_COLOR[step.status]||'#d97706';
                                  const bg=STEP_BG[step.status]||'#fef3c7';
                                  const StepIcon=stepIcon(step.status);
                                  const ts=step.date||step.timestamp;
                                  return (
                                    <div key={i} style={{display:'flex',gap:12}}>
                                      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                                        <div style={{width:30,height:30,borderRadius:999,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:bg}}><StepIcon size={13} style={{color}}/></div>
                                        {!isLast&&<div style={{width:2,flex:1,minHeight:20,background:'#f1f5f9',margin:'4px 0'}}/>}
                                      </div>
                                      <div style={{paddingBottom:isLast?0:16,paddingTop:4}}>
                                        <p style={{color:'#0f172a',fontWeight:700,fontSize:13,textTransform:'capitalize',margin:0}}>{step.status.replace(/_/g,' ')}</p>
                                        {step.message&&<p style={{color:'#64748b',fontSize:12,marginTop:2}}>{step.message}</p>}
                                        {ts&&<p style={{color:'#94a3b8',fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>{new Date(ts).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {citizenPhoto&&(
                            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{marginBottom:14,background:'#fffbeb',border:'1.5px solid #fde68a',borderRadius:16,padding:'16px'}}>
                              <p style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,fontSize:13,color:'#92400e',marginBottom:12}}><Camera size={15}/> Your Evidence Photo</p>
                              <div style={{borderRadius:12,overflow:'hidden',height:160,position:'relative'}}>
                                <img src={citizenPhoto} alt="Evidence" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                <div style={{position:'absolute',bottom:8,left:8,background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6}}>Filed with complaint</div>
                              </div>
                            </motion.div>
                          )}

                          {resolutionPhoto&&(
                            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{marginBottom:14,background:'#ecfdf5',border:'1.5px solid #a7f3d0',borderRadius:16,padding:'16px'}}>
                              <p style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,fontSize:13,color:'#065f46',marginBottom:12}}><ImageIcon size={15}/> Resolution Proof</p>
                              <div style={{borderRadius:12,overflow:'hidden',height:160,position:'relative'}}>
                                <img src={resolutionPhoto} alt="Resolution" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6}}>Uploaded by field worker</div>
                              </div>
                              {['resolved','closed'].includes(item.status)&&<p style={{fontSize:11,color:'#059669',fontWeight:700,marginTop:10}}>Issue resolved. XP added to your account!</p>}
                            </motion.div>
                          )}

                          {item.status==='resolved'&&!item.citizenRating&&(
                            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={{marginTop:4,background:'#fff5ee',border:`1.5px solid ${OR}30`,borderRadius:16,padding:'16px'}}>
                              <p style={{fontWeight:800,fontSize:13,color:NV,marginBottom:12,display:'flex',alignItems:'center',gap:7}}><Star size={14} fill={OR} style={{color:OR}}/> Rate the Resolution <span style={{fontSize:10,color:'#94a3b8',fontWeight:600,marginLeft:4}}>+5 XP for feedback</span></p>
                              {ratingTarget===item._id?(
                                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                                  <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                                    {[1,2,3,4,5].map(n=>(
                                      <button key={n} onClick={()=>setRatingValue(n)} style={{width:40,height:40,borderRadius:12,border:'none',cursor:'pointer',fontSize:20,background:ratingValue>=n?'#fef3c7':'#f8fafc',transform:ratingValue>=n?'scale(1.15)':'scale(1)',transition:'all 0.15s',boxShadow:ratingValue>=n?'0 2px 8px rgba(245,158,11,0.3)':'none'}}>⭐</button>
                                    ))}
                                  </div>
                                  <div style={{display:'flex',gap:8}}>
                                    <button onClick={()=>{setRatingTarget(null);setRatingValue(0);}} style={{flex:1,padding:'10px',borderRadius:12,border:'1.5px solid #f0ebe3',background:'transparent',fontFamily:FF,fontSize:12,fontWeight:700,color:'#64748b',cursor:'pointer'}}>Cancel</button>
                                    <button onClick={()=>handleRate(item._id,ratingValue)} disabled={!ratingValue||ratingLoading} style={{flex:1,padding:'10px',borderRadius:12,border:'none',background:ratingValue?OR:'#f1f5f9',color:ratingValue?'#fff':'#94a3b8',fontFamily:FF,fontSize:12,fontWeight:900,cursor:ratingValue?'pointer':'not-allowed',boxShadow:ratingValue?`0 4px 12px ${OR}35`:'none',transition:'all 0.2s'}}>
                                      {ratingLoading?'Submitting…':ratingValue?`Submit ${ratingValue}★`:'Pick stars first'}
                                    </button>
                                  </div>
                                </div>
                              ):(
                                <button onClick={()=>{setRatingTarget(item._id);setRatingValue(0);}} style={{width:'100%',padding:'11px',borderRadius:12,border:`2px dashed ${OR}40`,background:'transparent',fontFamily:FF,fontSize:13,fontWeight:800,color:OR,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#fff5ee'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Tap to Rate ★</button>
                              )}
                            </motion.div>
                          )}

                          {item.citizenRating&&(
                            <div style={{marginTop:12,display:'flex',alignItems:'center',gap:8,fontSize:12,fontWeight:700,color:'#64748b',background:'#f8fafc',borderRadius:12,padding:'10px 14px'}}>
                              <Star size={13} fill="#f59e0b" style={{color:'#f59e0b'}}/> You rated this {item.citizenRating}★
                              {item.status==='escalated'&&<span style={{marginLeft:'auto',fontSize:9,fontWeight:800,color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:999,padding:'2px 8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Escalated</span>}
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ComplaintPage;
