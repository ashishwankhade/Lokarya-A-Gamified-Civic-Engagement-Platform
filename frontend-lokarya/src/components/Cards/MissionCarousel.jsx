import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Zap, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

// ── Decorative top grass divider (inverted — grass points down from top) ─────
const GrassTop = ({ fill = '#fff9f2', bg = '#fff' }) => (
  <div style={{ position:'relative', marginBottom:-2, lineHeight:0 }}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display:'block', width:'100%', height:80, background:fill }}>
      <path fill={bg}
        d="M0,0 L0,40 C20,58 35,22 50,44 C65,66 75,28 90,48 C105,68 115,30 130,50 C145,70 158,28 175,50 C192,72 200,34 220,52 C240,70 250,30 270,52 C290,74 300,32 320,54 C340,76 352,34 370,54 C388,74 400,36 420,56 C440,76 452,36 470,58 C488,78 500,40 520,58 C540,76 550,40 570,60 C590,80 602,42 620,62 C638,82 650,44 670,64 C690,84 700,46 720,66 C740,86 752,48 770,68 C788,88 800,52 820,70 C840,88 852,54 870,72 C888,90 900,56 920,74 C940,92 952,58 970,76 C988,94 1000,60 1020,78 C1040,96 1050,64 1070,80 C1090,96 1100,66 1120,82 C1140,98 1152,68 1170,84 C1188,100 1200,72 1220,88 C1240,100 1252,76 1270,90 C1288,100 1300,80 1320,92 C1340,100 1352,84 1370,94 C1388,100 1400,88 1440,96 L1440,0 Z"/>
    </svg>
  </div>
);

const GrassBottom = ({ fill = '#fff', bg = '#fff9f2' }) => (
  <div style={{ position:'relative', marginTop:-2, lineHeight:0 }}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display:'block', width:'100%', height:80, background:bg }}>
      <path fill={fill}
        d="M0,80 L0,40 C20,22 35,58 50,36 C65,14 75,52 90,32 C105,12 115,50 130,30 C145,10 158,52 175,30 C192,8 200,46 220,28 C240,10 250,50 270,28 C290,6 300,48 320,26 C340,4 352,46 370,26 C388,6 400,44 420,24 C440,4 452,44 470,22 C488,2 500,40 520,22 C540,4 550,40 570,20 C590,0 602,38 620,18 C638,-2 650,36 670,16 C690,-4 700,34 720,14 C740,-6 752,32 770,12 C788,-8 800,28 820,10 C840,-8 852,26 870,8 C888,-10 900,24 920,6 C940,-12 952,22 970,4 C988,-14 1000,20 1020,2 C1040,-16 1050,16 1070,0 C1090,-16 1100,14 1120,0 C1140,-14 1152,12 1170,0 L1440,0 L1440,80 Z"/>
    </svg>
  </div>
);

// Category config
const CAT = {
  'Environment':     { bg:'#dcfce7', text:'#15803d', dot:'#22c55e' },
  'Education':       { bg:'#dbeafe', text:'#1d4ed8', dot:'#3b82f6' },
  'Healthcare':      { bg:'#fee2e2', text:'#b91c1c', dot:'#ef4444' },
  'Social':          { bg:'#ede9fe', text:'#6d28d9', dot:'#8b5cf6' },
  'Animal Welfare':  { bg:'#fef3c7', text:'#92400e', dot:'#f59e0b' },
  'Sanitation':      { bg:'#ccfbf1', text:'#0f766e', dot:'#14b8a6' },
  'Disaster Relief': { bg:'#ffedd5', text:'#c2410c', dot:'#f97316' },
};

const MissionCard = ({ mission }) => {
  const cat = CAT[mission.category] || { bg:'#f1f5f9', text:'#475569', dot:'#94a3b8' };
  const spotsLeft = mission.spotsLeft ?? (mission.maxParticipants - (mission.participants?.length || 0));

  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      overflow: 'hidden',
      border: '2px solid #f0ebe3',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.25s, box-shadow 0.25s',
      fontFamily: "'DM Sans', sans-serif",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 20px 48px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>

      {/* Image */}
      <div style={{ position:'relative', height:180, overflow:'hidden', flexShrink:0 }}>
        <img src={mission.banner || 'https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=600'}
          alt={mission.title}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block',
            transition:'transform 0.5s' }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.06)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(15,28,48,0.7) 0%, transparent 60%)' }}/>

        {/* XP badge — pill style */}
        <div style={{
          position:'absolute', bottom:12, left:12,
          display:'flex', alignItems:'center', gap:6,
          background:'linear-gradient(135deg,#F47C20,#f59e0b)',
          borderRadius:999, padding:'5px 12px',
          boxShadow:'0 4px 12px rgba(244,124,32,0.45)',
        }}>
          <Zap size={12} fill="#fff" color="#fff"/>
          <span style={{ color:'#fff', fontWeight:900, fontSize:13 }}>+{mission.pointsReward} XP</span>
        </div>

        {/* Category pill */}
        <div style={{ position:'absolute', top:12, right:12 }}>
          <span style={{
            background: cat.bg, color: cat.text,
            fontSize:10, fontWeight:800, padding:'4px 10px',
            borderRadius:999, letterSpacing:'0.05em', textTransform:'uppercase',
          }}>
            {mission.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', flex:1 }}>
        <p style={{ color:'#F47C20', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
          {mission.ngo?.organizationName || mission.ngo?.name || 'Community Guild'}
        </p>

        <h3 style={{ color:'#0f1c2e', fontWeight:900, fontSize:17, lineHeight:1.3,
          marginBottom:14, display:'-webkit-box', WebkitLineClamp:2,
          WebkitBoxOrient:'vertical', overflow:'hidden', fontFamily:"'Fraunces',serif" }}>
          {mission.title}
        </h3>

        <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:16 }}>
          {[
            { icon: Calendar, text: new Date(mission.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) },
            { icon: MapPin,   text: mission.location?.name || 'Nagpur' },
            { icon: Users,    text: spotsLeft > 0 ? `${spotsLeft} spots left` : 'Mission Full' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:12.5 }}>
              <Icon size={13} style={{ color:'#F47C20', flexShrink:0 }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop:'auto' }}>
          <a href="/activities" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px', borderRadius:12,
            background:'#0f2c4a', color:'#fff',
            fontWeight:800, fontSize:13, textDecoration:'none',
            transition:'background 0.2s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#F47C20'}
            onMouseLeave={e=>e.currentTarget.style.background='#0f2c4a'}>
            View Mission <ArrowRight size={15}/>
          </a>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div style={{ background:'#fff', borderRadius:24, overflow:'hidden', border:'2px solid #f0ebe3' }}>
    <div style={{ height:180, background:'#f1f5f9' }}/>
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
      {[60,80,50,40,100].map((w,i)=>(
        <div key={i} style={{ height:i===1?18:12, background:'#f1f5f9', borderRadius:6, width:`${w}%` }}/>
      ))}
    </div>
  </div>
);

const MissionCarousel = () => {
  const [missions,     setMissions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [activeIndex,  setActiveIndex]  = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const intervalRef = useRef(null);

  useEffect(() => {
    const update = () => {
      if      (window.innerWidth < 640)  setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else                               setVisibleCount(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/activities');
        if (!Array.isArray(data)) { setError(true); return; }
        setMissions(data.slice(0, 9));
      } catch { setError(true); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const maxIndex = Math.max(0, missions.length - visibleCount);
  const next = () => setActiveIndex(i => Math.min(i + 1, maxIndex));
  const prev = () => setActiveIndex(i => Math.max(i - 1, 0));

  useEffect(() => {
    if (missions.length <= visibleCount) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, 4200);
    return () => clearInterval(intervalRef.current);
  }, [missions.length, visibleCount, maxIndex]);

  useEffect(() => { setActiveIndex(i => Math.min(i, maxIndex)); }, [maxIndex]);

  const GAP = 24;
  const cardWidthPx = `calc((100% - ${GAP * (visibleCount - 1)}px) / ${visibleCount})`;
  const slideOffset = activeIndex > 0
    ? `calc(-${activeIndex} * (${cardWidthPx} + ${GAP}px))`
    : '0px';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,900&display=swap');
      `}</style>

      <GrassTop fill="#fff9f2" bg="#fff"/>

      <section style={{
        background: '#fff',
        padding: '0 24px 80px',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Faint dot decoration */}
        <div style={{ position:'absolute', top:40, right:60, opacity:0.15,
          backgroundImage:'radial-gradient(circle, #F47C20 1.5px, transparent 1.5px)',
          backgroundSize:'24px 24px', width:180, height:180, borderRadius:'50%' }}/>

        <div style={{ maxWidth:1280, margin:'0 auto' }}>

          {/* Section header */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, marginBottom:40, flexWrap:'wrap' }}>
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}>
              {/* Eyebrow */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:32, height:3, background:'#F47C20', borderRadius:3 }}/>
                <span style={{ color:'#F47C20', fontSize:11, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                  Live from Nagpur
                </span>
              </div>
              <h2 style={{
                fontFamily:"'Fraunces',serif", fontWeight:900,
                fontSize:'clamp(32px,4vw,52px)', color:'#0f1c2e',
                lineHeight:1.1, marginBottom:8,
              }}>
                Active <span style={{ color:'#F47C20', fontStyle:'italic' }}>Missions</span>
              </h2>
              <p style={{ color:'#64748b', fontSize:15 }}>Join a mission, earn XP, and make your city better.</p>
            </motion.div>

            {missions.length > visibleCount && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={prev} disabled={activeIndex === 0}
                  style={{
                    width:44, height:44, borderRadius:'50%', border:'2px solid #e2e8f0',
                    background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    opacity: activeIndex===0 ? 0.35 : 1, transition:'border-color 0.2s',
                  }}
                  onMouseEnter={e=>{ if(activeIndex>0) e.currentTarget.style.borderColor='#F47C20'; }}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                  <ChevronLeft size={18} color="#0f1c2e"/>
                </button>
                <button onClick={next} disabled={activeIndex >= maxIndex}
                  style={{
                    width:44, height:44, borderRadius:'50%', border:'2px solid #e2e8f0',
                    background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    opacity: activeIndex>=maxIndex ? 0.35 : 1, transition:'border-color 0.2s',
                  }}
                  onMouseEnter={e=>{ if(activeIndex<maxIndex) e.currentTarget.style.borderColor='#F47C20'; }}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                  <ChevronRight size={18} color="#0f1c2e"/>
                </button>
              </div>
            )}
          </div>

          {/* Cards */}
          <div style={{ overflow:'hidden' }}>
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${visibleCount},1fr)`, gap:GAP }}>
                {Array.from({length:visibleCount}).map((_,i)=><SkeletonCard key={i}/>)}
              </div>
            ) : error || missions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px 24px', borderRadius:24,
                border:'2px dashed #e2e8f0', background:'#fafafa' }}>
                <p style={{ color:'#94a3b8', fontWeight:700, fontSize:16 }}>No active missions right now.</p>
                <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>NGOs post new missions regularly — check back soon!</p>
              </div>
            ) : (
              <motion.div style={{ display:'flex', gap:GAP }}
                animate={{ x: slideOffset }}
                transition={{ type:'spring', stiffness:280, damping:28 }}>
                {missions.map(m => (
                  <div key={m._id} style={{ width:cardWidthPx, flexShrink:0 }}>
                    <MissionCard mission={m}/>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Dots */}
          {!loading && missions.length > visibleCount && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)}
                  style={{
                    borderRadius:999, border:'none', cursor:'pointer',
                    background: activeIndex===i ? '#F47C20' : '#e2e8f0',
                    width: activeIndex===i ? 28 : 10, height:10,
                    transition:'width 0.3s, background 0.3s',
                  }}/>
              ))}
            </div>
          )}

          {/* View all */}
          {!loading && missions.length > 0 && (
            <div style={{ textAlign:'center', marginTop:48 }}>
              <a href="/activities" style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'14px 32px', borderRadius:14,
                background:'#0f2c4a', color:'#fff',
                fontWeight:800, fontSize:15, textDecoration:'none',
                transition:'background 0.2s, transform 0.2s',
                boxShadow:'0 6px 20px rgba(15,44,74,0.2)',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='#F47C20'; e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#0f2c4a'; e.currentTarget.style.transform='translateY(0)';}}>
                View All Missions <ArrowRight size={18}/>
              </a>
            </div>
          )}
        </div>
      </section>

      <GrassBottom fill="#fff9f2" bg="#fff"/>
    </>
  );
};

export default MissionCarousel;
