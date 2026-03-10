import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, MapPin } from 'lucide-react';

// ── Decorative SVGs ──────────────────────────────────────────────────────────

// Hand-drawn style star burst
const StarBurst = ({ size = 40, color = '#F47C20', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={style}>
    <path d="M30 2 L33 24 L54 18 L36 32 L54 44 L32 36 L30 58 L28 36 L6 44 L24 32 L6 18 L27 24 Z"
      fill={color} opacity="0.9"/>
  </svg>
);

// Wobbly blob shape
const Blob = ({ color, style }) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ position:'absolute', ...style }}>
    <path fill={color} d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-1C87,14.3,81.4,28.6,72.8,40.9C64.2,53.2,52.6,63.5,39.3,70.3C26,77.1,11,80.4,-3.9,85.8C-18.8,91.2,-37.6,98.7,-51.2,93.6C-64.8,88.5,-73.2,70.8,-79.1,53.3C-85,35.8,-88.4,18.4,-87.2,1.3C-86,-15.8,-80.2,-31.6,-71.3,-44.7C-62.4,-57.8,-50.4,-68.2,-37.1,-75.9C-23.8,-83.6,-9,-88.6,3.5,-94.1C16,-99.6,30.6,-83.6,44.7,-76.4Z"
      transform="translate(100 100)" opacity="0.15"/>
  </svg>
);

// Grass divider at bottom of hero
const GrassDivider = ({ fill = '#fff9f2' }) => (
  <div style={{ position:'absolute', bottom:0, left:0, right:0, lineHeight:0, zIndex:5 }}>
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ display:'block', width:'100%', height:100 }}>
      {/* Back grass layer */}
      <path fill={fill} opacity="0.4"
        d="M0,100 L0,60 C20,45 35,80 50,55 C65,30 75,70 90,50 C105,30 115,65 130,48 C145,31 158,72 175,52 C192,32 200,68 220,50 C240,32 250,70 270,52 C290,34 300,72 320,54 C340,36 352,74 370,56 C388,38 400,76 420,58 C440,40 452,78 470,60 C488,42 500,80 520,62 C540,44 550,82 570,64 C590,46 602,84 620,66 C638,48 650,86 670,68 C690,50 700,88 720,70 C740,52 752,90 770,72 C788,54 800,92 820,74 C840,56 852,94 870,76 C888,58 900,96 920,78 C940,60 952,98 970,80 C988,62 1000,100 1020,82 C1040,64 1050,100 1070,84 C1090,68 1100,100 1120,86 C1140,72 1152,100 1170,88 C1188,76 1200,100 1220,90 C1240,80 1252,100 1270,92 C1288,84 1300,100 1320,94 C1340,88 1352,100 1370,96 C1388,92 1400,100 1440,100 L1440,100 Z"/>
      {/* Front grass spikes */}
      <path fill={fill}
        d="M0,100 L0,80 C15,60 25,90 40,70 C55,50 62,85 80,65 C98,45 108,80 125,62 C142,44 152,78 170,60 C188,42 195,78 215,60 C235,42 242,78 262,58 C282,38 292,75 312,55 C332,35 342,72 362,52 C382,32 392,70 412,50 C432,30 442,68 462,48 C482,28 492,66 512,46 C532,26 542,64 562,44 C582,24 592,62 612,42 C632,22 642,60 662,40 C682,20 692,58 712,38 C732,18 742,56 762,36 C782,16 792,54 812,34 C832,14 842,52 862,32 C882,12 892,50 912,30 C932,10 942,48 962,28 C982,8 992,46 1012,26 C1032,6 1042,44 1062,24 C1082,4 1092,42 1112,22 C1132,2 1142,40 1162,20 C1182,0 1192,38 1212,20 C1232,2 1242,36 1262,18 C1282,0 1292,36 1312,18 C1332,0 1342,34 1362,16 C1382,0 1392,32 1412,16 L1440,0 L1440,100 Z"/>
    </svg>
  </div>
);

// Floating doodle dot cluster
const DotCluster = ({ style }) => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ position:'absolute', ...style }}>
    {[
      [10,10],[25,8],[40,12],[55,8],[70,10],
      [8,28],[22,24],[38,28],[54,24],[72,28],
      [12,46],[28,42],[44,46],[60,42],[76,46],
    ].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r="3" fill="#F47C20" opacity="0.35"/>
    ))}
  </svg>
);

// Animated counter
const AnimCounter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ''));
    let start = 0;
    const step = Math.ceil(num / 50);
    const id = setInterval(() => {
      start += step;
      if (start >= num) { setVal(num); clearInterval(id); }
      else setVal(start);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
};

// ── Component ────────────────────────────────────────────────────────────────
const HeroSection = ({ onJoin, onReport }) => {
  const stats = [
    { value: '2400', suffix: '+', label: 'Citizens Active', emoji: '👥' },
    { value: '380',  suffix: '+', label: 'Issues Resolved',  emoji: '✅' },
    { value: '60',   suffix: '+', label: 'NGO Missions',     emoji: '🤝' },
  ];

  return (
    <section style={{
      position: 'relative',
      background: 'linear-gradient(160deg, #0a1f35 0%, #0f3054 50%, #0a2540 100%)',
      minHeight: '92vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: 100,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,900&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..900&display=swap');
        .hero-btn-primary { transition: transform 0.2s, box-shadow 0.2s; }
        .hero-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(244,124,32,0.45); }
        .hero-btn-secondary { transition: transform 0.2s, background 0.2s; }
        .hero-btn-secondary:hover { transform: translateY(-3px); background: rgba(255,255,255,0.12) !important; }
        .stat-card { transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* Background decorations */}
      <Blob color="#F47C20" style={{ top:'-10%', right:'-5%', width:500, height:500, opacity:1 }}/>
      <Blob color="#14b8a6" style={{ bottom:'-15%', left:'-8%', width:450, height:450, opacity:1 }}/>
      <DotCluster style={{ top: 80, right: '12%', opacity: 0.7 }}/>
      <DotCluster style={{ bottom: 140, left: '5%', opacity: 0.5 }}/>

      {/* Faint grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}/>

      {/* Decorative star bursts */}
      <StarBurst size={48} color="#F47C20" style={{ position:'absolute', top:'14%', right:'28%', opacity:0.7 }}/>
      <StarBurst size={28} color="#fde68a" style={{ position:'absolute', top:'32%', right:'18%', opacity:0.5 }}/>
      <StarBurst size={20} color="#5eead4" style={{ position:'absolute', bottom:'28%', left:'38%', opacity:0.4 }}/>

      {/* Right-side image card */}
      <motion.div
        initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        style={{
          position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)',
          width: 340, display: 'none',
        }}
        className="lg:block"
      >
        <div style={{
          borderRadius: 24, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.12)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <img
            src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600"
            alt="Community volunteers"
            style={{ width:'100%', height:260, objectFit:'cover', display:'block' }}
          />
          <div style={{ padding: 20 }}>
            {/* XP floating chip */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(244,124,32,0.15)', border: '1px solid rgba(244,124,32,0.4)',
              borderRadius: 999, padding: '6px 14px', marginBottom: 10,
            }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 13 }}>Earn XP for every action</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6 }}>
              From reporting potholes to joining tree-plantation drives — every contribution counts.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px 0', position: 'relative', zIndex: 10, width: '100%' }}>
        <div style={{ maxWidth: 680 }}>

          {/* Location pill */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 999, marginBottom: 28,
              background: 'rgba(20,184,166,0.12)', border: '1.5px solid rgba(20,184,166,0.3)',
            }}>
            <MapPin size={13} style={{ color: '#2dd4bf' }}/>
            <span style={{ color: '#2dd4bf', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Nagpur, Maharashtra
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(48px, 7vw, 82px)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: '#ffffff',
              marginBottom: 24,
              letterSpacing: '-0.02em',
            }}>
              Be the Change<br/>
              <span style={{ position:'relative', display:'inline-block' }}>
                <span style={{
                  background: 'linear-gradient(135deg, #F47C20 0%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Nagpur Needs.</span>
                {/* Underline doodle */}
                <svg viewBox="0 0 300 18" style={{ position:'absolute', bottom:-8, left:0, width:'100%', height:18 }}>
                  <path d="M4 9 Q75 3 150 9 Q225 15 296 9" stroke="#F47C20" strokeWidth="3.5"
                    strokeLinecap="round" fill="none" opacity="0.6"/>
                </svg>
              </span>
            </h1>
          </motion.div>

          {/* Sub */}
          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            style={{
              color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.75,
              marginBottom: 40, maxWidth: 520,
              fontFamily: "'DM Sans', sans-serif",
            }}>
            Report civic issues, join community missions, and earn real rewards for making Nagpur better — all in one platform.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            style={{ display:'flex', flexWrap:'wrap', gap:14, marginBottom:56 }}>

            <button onClick={onJoin} className="hero-btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '15px 30px', borderRadius: 14,
                background: 'linear-gradient(135deg, #F47C20, #e06b10)',
                color: '#fff', fontWeight: 800, fontSize: 15,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(244,124,32,0.35)',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              Join the Movement
              <ArrowRight size={18}/>
            </button>

            <button onClick={onReport} className="hero-btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '15px 30px', borderRadius: 14,
                background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontWeight: 800, fontSize: 15,
                border: '1.5px solid rgba(255,255,255,0.18)',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
              <AlertTriangle size={18} style={{ color:'#fb923c' }}/>
              Report an Issue
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
            style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            {stats.map((s, i) => (
              <motion.div key={i} className="stat-card"
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 16, padding: '14px 22px',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                <span style={{ fontSize: 26, fontFamily:"'Fraunces',serif", fontWeight: 900, color: '#fff' }}>
                  <AnimCounter target={s.value} suffix={s.suffix}/>
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  {s.emoji} {s.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Grass bottom divider */}
      <GrassDivider fill="#fff9f2"/>
    </section>
  );
};

export default HeroSection;
