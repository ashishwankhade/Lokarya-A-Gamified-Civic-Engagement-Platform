import React from 'react';
import { motion } from 'framer-motion';

// ── Grass top divider ─────────────────────────────────────────────────────────
const GrassTopDivider = ({ fill = '#fff9f2', bg = '#fff' }) => (
  <div style={{ lineHeight:0, background:bg }}>
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ display:'block', width:'100%', height:90 }}>
      <rect width="1440" height="90" fill={bg}/>
      {/* Back soft hills */}
      <path fill={fill} opacity="0.45"
        d="M0,90 L0,55 Q120,20 240,50 Q360,80 480,48 Q600,16 720,46 Q840,76 960,44 Q1080,12 1200,44 Q1320,76 1440,50 L1440,90 Z"/>
      {/* Front grass spikes */}
      <path fill={fill}
        d="M0,90 L0,70 C12,52 20,78 32,60 C44,42 52,72 65,54 C78,36 85,68 98,50 C111,32 118,64 132,46 C146,28 152,62 167,44 C182,26 188,60 203,42 C218,24 224,58 240,40 C256,22 262,56 278,38 C294,20 300,54 317,36 C334,18 340,52 357,34 C374,16 380,50 398,32 C416,14 422,48 440,30 C458,12 464,46 482,28 C500,10 506,44 525,26 C544,8 550,42 568,24 C586,6 592,40 612,22 C632,4 638,38 657,20 C676,2 682,36 702,18 C722,0 728,34 748,16 C768,0 774,32 794,14 C814,0 820,30 840,12 C860,0 866,28 887,10 C908,0 914,26 935,8 C956,0 962,24 983,6 C1004,0 1010,22 1032,4 C1054,0 1060,20 1082,2 C1104,0 1110,18 1132,0 C1154,0 1160,16 1182,0 L1440,0 L1440,90 Z"/>
    </svg>
  </div>
);

// Badge shapes
const BADGE_SHAPES = {
  green:  { grad:['#86EFAC','#22c55e','#15803d'], pill:'#dcfce7', pillText:'#15803d', glow:'rgba(34,197,94,0.25)' },
  blue:   { grad:['#93C5FD','#3b82f6','#1d4ed8'], pill:'#dbeafe', pillText:'#1d4ed8', glow:'rgba(59,130,246,0.25)' },
  orange: { grad:['#FDBA74','#F47C20','#c2410c'], pill:'#ffedd5', pillText:'#c2410c', glow:'rgba(244,124,32,0.28)' },
  purple: { grad:['#D8B4FE','#a855f7','#6d28d9'], pill:'#ede9fe', pillText:'#6d28d9', glow:'rgba(168,85,247,0.25)' },
  yellow: { grad:['#FDE68A','#f59e0b','#92400e'], pill:'#fef3c7', pillText:'#92400e', glow:'rgba(245,158,11,0.28)' },
};

const BadgeCard = ({ colorTheme, title, subtitle, level, xp, index }) => {
  const t = BADGE_SHAPES[colorTheme] || BADGE_SHAPES.green;
  const gradId = `lokarya-grad-${colorTheme}`;

  return (
    <motion.div
      initial={{ opacity:0, y:30, scale:0.92 }}
      whileInView={{ opacity:1, y:0, scale:1 }}
      viewport={{ once:true }}
      transition={{ delay: index * 0.1, type:'spring', stiffness:200, damping:22 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', cursor:'pointer' }}>

      <motion.div
        whileHover={{ y:-8, filter:`drop-shadow(0 16px 24px ${t.glow})` }}
        transition={{ type:'spring', stiffness:300, damping:20 }}
        style={{ marginBottom:16, position:'relative' }}>

        <svg viewBox="0 0 110 110" style={{ width:'clamp(110px,14vw,150px)', height:'clamp(110px,14vw,150px)' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={t.grad[0]}/>
              <stop offset="50%"  stopColor={t.grad[1]}/>
              <stop offset="100%" stopColor={t.grad[2]}/>
            </linearGradient>
            {/* Shine overlay */}
            <linearGradient id={`shine-${colorTheme}`} x1="0%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%"  stopColor="rgba(255,255,255,0.35)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="55" cy="100" rx="32" ry="6" fill="rgba(0,0,0,0.1)"/>
          {/* Main hexagon */}
          <path
            d="M55 4 L102 22 L91 72 L55 106 L19 72 L8 22 Z"
            fill={`url(#${gradId})`}
            stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinejoin="round"/>
          {/* Shine */}
          <path
            d="M55 4 L102 22 L91 72 L55 106 L19 72 L8 22 Z"
            fill={`url(#shine-${colorTheme})`}
            strokeLinejoin="round"/>
        </svg>

        {/* Text overlay inside badge */}
        <div style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', paddingBottom:8,
        }}>
          <span style={{ color:'#fff', fontWeight:900, fontSize:'clamp(13px,1.6vw,18px)',
            textTransform:'uppercase', letterSpacing:'-0.02em', lineHeight:1.1,
            textShadow:'0 2px 4px rgba(0,0,0,0.25)', fontFamily:"'DM Sans',sans-serif" }}>
            {title}
          </span>
          <div style={{ width:'clamp(28px,3vw,44px)', height:1.5, background:'rgba(255,255,255,0.7)', margin:'5px 0' }}/>
          <span style={{ color:'rgba(255,255,255,0.85)', fontFamily:'Georgia,serif', fontStyle:'italic',
            fontSize:'clamp(10px,1.2vw,14px)', lineHeight:1 }}>
            Lokarya
          </span>
          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'clamp(7px,0.8vw,10px)',
            fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:4 }}>
            {subtitle}
          </span>
        </div>
      </motion.div>

      {/* Level pill */}
      <span style={{
        background: t.pill, color: t.pillText,
        borderRadius:999, padding:'4px 14px',
        fontSize:11, fontWeight:800, marginBottom:6,
        textTransform:'uppercase', letterSpacing:'0.07em',
        border:`1.5px solid ${t.pillText}20`,
      }}>
        {level}
      </span>

      <span style={{ color:'#64748b', fontSize:12, fontWeight:700 }}>{xp}</span>
    </motion.div>
  );
};

const RewardsSection = () => {
  const levels = [
    { theme:'green',  title:'Civic',   subtitle:'Scout',    level:'Level 1', xp:'0 – 200 XP' },
    { theme:'blue',   title:'Urban',   subtitle:'Guardian', level:'Level 2', xp:'201 – 1K XP' },
    { theme:'orange', title:'Impact',  subtitle:'Maker',    level:'Level 3', xp:'1K – 3K XP' },
    { theme:'purple', title:'City',    subtitle:'Champion', level:'Level 4', xp:'3K – 5K XP' },
    { theme:'yellow', title:'Lokarya', subtitle:'Legend',   level:'Level 5', xp:'5K+ XP' },
  ];

  const earningRates = [
    { emoji:'🌱', label:'Report Issue',  xp:'+20 XP', color:'#059669', bg:'#ecfdf5', border:'#a7f3d0' },
    { emoji:'🤝', label:'Join Mission',  xp:'+30 XP', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
    { emoji:'✅', label:'Issue Resolved',xp:'+50 XP', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
    { emoji:'🔍', label:'Verify Report', xp:'+5 XP',  color:'#d97706', bg:'#fef3c7', border:'#fde68a' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,900;9..144,1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800;9..40,900&display=swap');
      `}</style>

      <GrassTopDivider fill="#fff9f2" bg="#fff"/>

      <section style={{
        background: '#fff9f2',
        padding: '60px 24px 100px',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Background circles */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
          width:800, height:800, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(244,124,32,0.05) 0%, transparent 70%)',
          pointerEvents:'none' }}/>

        <div style={{ maxWidth:1280, margin:'0 auto' }}>

          {/* Header */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:32, height:3, background:'#F47C20', borderRadius:3 }}/>
              <span style={{ color:'#F47C20', fontSize:11, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                Gamified Progression
              </span>
              <div style={{ width:32, height:3, background:'#F47C20', borderRadius:3 }}/>
            </div>
            <h2 style={{
              fontFamily:"'Fraunces',serif", fontWeight:900,
              fontSize:'clamp(32px,4.5vw,56px)', color:'#0f1c2e',
              lineHeight:1.1, marginBottom:10,
            }}>
              Climb the <span style={{ color:'#F47C20', fontStyle:'italic' }}>Ranks</span>
            </h2>
            <p style={{ color:'#64748b', fontSize:15, maxWidth:480, margin:'0 auto' }}>
              Report issues and join missions to earn XP and unlock higher tiers in Nagpur's civic movement.
            </p>
          </motion.div>

          {/* Badge row */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',
            gap:'clamp(16px,3vw,40px)',
            marginBottom:64,
            justifyItems:'center',
          }}>
            {levels.map((lvl, i) => (
              <BadgeCard key={lvl.title} index={i}
                colorTheme={lvl.theme} title={lvl.title} subtitle={lvl.subtitle}
                level={lvl.level} xp={lvl.xp}/>
            ))}
          </div>

          {/* Earning rates card */}
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.5 }}>

            {/* Card */}
            <div style={{
              background:'#fff', borderRadius:24, border:'2px solid #f0ebe3',
              padding:'32px 40px', maxWidth:760, margin:'0 auto',
              boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
            }}>
              <p style={{ textAlign:'center', color:'#94a3b8', fontSize:11, fontWeight:800,
                textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:24 }}>
                Earning Rates
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:12 }}>
                {earningRates.map((r, i) => (
                  <motion.div key={i}
                    initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }}
                    viewport={{ once:true }} transition={{ delay: i * 0.08 }}
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      background: r.bg, border:`1.5px solid ${r.border}`,
                      borderRadius:12, padding:'10px 18px',
                    }}>
                    <span style={{ fontSize:20 }}>{r.emoji}</span>
                    <div>
                      <p style={{ color:r.color, fontWeight:800, fontSize:15 }}>{r.xp}</p>
                      <p style={{ color:'#64748b', fontSize:11 }}>{r.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress bar illustration */}
              <div style={{ marginTop:28, display:'flex', alignItems:'center', gap:0, position:'relative' }}>
                {levels.map((lvl, i) => {
                  const t = BADGE_SHAPES[lvl.theme];
                  return (
                    <React.Fragment key={i}>
                      <div style={{
                        width:20, height:20, borderRadius:'50%', flexShrink:0, zIndex:1,
                        background:`linear-gradient(135deg, ${t.grad[0]}, ${t.grad[1]})`,
                        border:'2.5px solid #fff',
                        boxShadow:`0 0 0 3px ${t.grad[1]}40`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }}/>
                      </div>
                      {i < levels.length - 1 && (
                        <div style={{
                          flex:1, height:4, borderRadius:2,
                          background:`linear-gradient(to right, ${t.grad[1]}, ${BADGE_SHAPES[levels[i+1].theme].grad[1]})`,
                        }}/>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                {levels.map(lvl => (
                  <span key={lvl.title} style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {lvl.title}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default RewardsSection;
