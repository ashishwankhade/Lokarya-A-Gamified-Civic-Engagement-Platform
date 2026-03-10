import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MessageSquare, Gift, ArrowRight, CheckCircle } from "lucide-react";

// Decorative wobbly divider between sections
const WaveDivider = ({ topColor, bottomColor }) => (
  <div style={{ lineHeight:0, background: topColor }}>
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display:'block', width:'100%', height:60, background:topColor }}>
      <path fill={bottomColor}
        d="M0,60 L0,30 Q180,0 360,28 Q540,56 720,28 Q900,0 1080,28 Q1260,56 1440,28 L1440,60 Z"/>
    </svg>
  </div>
);

// Feature pill card with icon
const FeatureRow = ({ icon: Icon, iconBg, iconColor, title, desc, delay }) => (
  <motion.div
    initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }}
    viewport={{ once:true }} transition={{ delay, duration:0.45 }}
    style={{
      display:'flex', gap:16, alignItems:'flex-start',
      padding:'16px 20px', borderRadius:16,
      background:'#fff', border:'2px solid #f0ebe3',
      boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
      transition:'transform 0.2s, box-shadow 0.2s',
    }}
    whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(0,0,0,0.09)' }}>
    <div style={{
      width:44, height:44, borderRadius:12, flexShrink:0,
      background:iconBg, display:'flex', alignItems:'center', justifyContent:'center',
      marginTop:2,
    }}>
      <Icon size={20} style={{ color:iconColor }}/>
    </div>
    <div>
      <h4 style={{ color:'#0f1c2e', fontWeight:800, fontSize:15, marginBottom:4 }}>{title}</h4>
      <p style={{ color:'#64748b', fontSize:13, lineHeight:1.65 }}>{desc}</p>
    </div>
  </motion.div>
);

// Hand-drawn style stat badge
const StatBadge = ({ value, label, color, bg, emoji }) => (
  <div style={{
    background: bg, border:`2px solid ${color}30`,
    borderRadius:16, padding:'14px 20px',
    display:'flex', flexDirection:'column', gap:2, flex:1, minWidth:100,
  }}>
    <span style={{ fontSize:28, fontFamily:"'Fraunces',serif", fontWeight:900, color }}>{value}</span>
    <span style={{ fontSize:11, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>
      {emoji} {label}
    </span>
  </div>
);

const AboutProgram = ({ onJoin, onReport }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,0,900;9..144,1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800;9..40,900&display=swap');
      `}</style>

      <WaveDivider topColor="#fff" bottomColor="#fff9f2"/>

      <section style={{
        background: '#fff9f2',
        padding: '80px 24px 100px',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background blob decoration */}
        <div style={{
          position:'absolute', top:-80, right:-80, width:400, height:400,
          background:'radial-gradient(circle, #F47C2018 0%, transparent 70%)',
          borderRadius:'50%', pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', bottom:-60, left:-60, width:320, height:320,
          background:'radial-gradient(circle, #14b8a618 0%, transparent 70%)',
          borderRadius:'50%', pointerEvents:'none',
        }}/>

        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{
            display:'grid', gap:64,
            gridTemplateColumns:'1fr',
          }}
            className="lg:grid-two-col">

            <style>{`
              @media(min-width:1024px){
                .about-grid { grid-template-columns: 1fr 1fr !important; align-items: center; }
              }
            `}</style>

            <div style={{ display:'grid', gap:64, alignItems:'center' }} className="about-grid">

              {/* LEFT — Image collage */}
              <motion.div
                initial={{ opacity:0, x:-40 }} whileInView={{ opacity:1, x:0 }}
                viewport={{ once:true }} transition={{ duration:0.6 }}
                style={{ position:'relative' }}>

                {/* Decorative dashed frame */}
                <div style={{
                  position:'absolute', top:16, left:-16, right:16, bottom:-16,
                  border:'3px dashed #F47C2040', borderRadius:28, zIndex:0,
                }}/>

                {/* Main image */}
                <div style={{
                  position:'relative', zIndex:1,
                  borderRadius:24, overflow:'hidden',
                  border:'3px solid #fff',
                  boxShadow:'0 16px 48px rgba(0,0,0,0.16)',
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=700&auto=format&fit=crop"
                    alt="Lokarya Community Action"
                    style={{ width:'100%', height:380, objectFit:'cover', display:'block' }}/>
                  <div style={{
                    position:'absolute', inset:0,
                    background:'linear-gradient(to top, rgba(15,44,74,0.75) 0%, transparent 55%)',
                  }}/>

                  {/* Caption overlay */}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 22px' }}>
                    <p style={{ color:'rgba(255,255,255,0.75)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                      Our Community
                    </p>
                    <p style={{ color:'#fff', fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, lineHeight:1.3 }}>
                      Making Nagpur better,<br/>one action at a time.
                    </p>
                  </div>
                </div>

                {/* Floating stat chips */}
                <motion.div
                  initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }}
                  viewport={{ once:true }} transition={{ delay:0.4, type:'spring' }}
                  style={{
                    position:'absolute', top:-20, right:-20, zIndex:10,
                    background:'#fff', borderRadius:16, padding:'12px 16px',
                    boxShadow:'0 8px 24px rgba(0,0,0,0.12)', border:'2px solid #f0ebe3',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                  <div style={{
                    width:40, height:40, borderRadius:12,
                    background:'linear-gradient(135deg,#F47C20,#f59e0b)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <span style={{ fontSize:20 }}>⭐</span>
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:22, color:'#0f1c2e', lineHeight:1 }}>380+</p>
                    <p style={{ fontSize:11, color:'#94a3b8', fontWeight:700 }}>Issues Resolved</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }}
                  viewport={{ once:true }} transition={{ delay:0.5, type:'spring' }}
                  style={{
                    position:'absolute', bottom:-20, left:-20, zIndex:10,
                    background:'#0f2c4a', borderRadius:16, padding:'12px 16px',
                    boxShadow:'0 8px 24px rgba(15,44,74,0.3)',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                  <span style={{ fontSize:22 }}>🏆</span>
                  <div>
                    <p style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:20, color:'#fff', lineHeight:1 }}>2,400+</p>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:700 }}>Active Citizens</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT — Content */}
              <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

                {/* Eyebrow */}
                <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <div style={{ width:32, height:3, background:'#F47C20', borderRadius:3 }}/>
                    <span style={{ color:'#F47C20', fontSize:11, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                      Initiative for Societal Betterment
                    </span>
                  </div>
                  <h2 style={{
                    fontFamily:"'Fraunces',serif", fontWeight:900,
                    fontSize:'clamp(34px,4vw,52px)', color:'#0f1c2e',
                    lineHeight:1.1, marginBottom:12,
                  }}>
                    Welcome to<br/>
                    <span style={{ color:'#F47C20', fontStyle:'italic' }}>Lokarya.</span>
                  </h2>
                  <p style={{ color:'#64748b', fontSize:15, lineHeight:1.75, paddingLeft:16, borderLeft:'3px solid #f0ebe3' }}>
                    A comprehensive digital solution transforming how citizens engage with communities. We connect{' '}
                    <strong style={{ color:'#0f1c2e' }}>Citizens, NGOs, and Authorities</strong> to drive transparency and real action.
                  </p>
                </motion.div>

                {/* Feature rows */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <FeatureRow icon={AlertTriangle} iconBg="#fff0e8" iconColor="#F47C20"
                    title="Report Civic Issues"
                    desc="Easily report garbage, broken roads, or potholes directly to authorities — with photo evidence and live tracking."
                    delay={0.1}/>
                  <FeatureRow icon={MessageSquare} iconBg="#eff6ff" iconColor="#3b82f6"
                    title="AI Guidance Chatbot"
                    desc="Get instant guidance on government schemes and civic processes via our smart assistant."
                    delay={0.2}/>
                  <FeatureRow icon={Gift} iconBg="#ecfdf5" iconColor="#059669"
                    title="Earn Real Rewards"
                    desc="Gain XP for every contribution — reports, missions, verifications — and redeem for exciting rewards."
                    delay={0.3}/>
                </div>

                {/* CTAs */}
                <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.4 }}
                  style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                  <button onClick={onJoin}
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'13px 26px', borderRadius:14,
                      background:'#0f2c4a', color:'#fff',
                      fontWeight:800, fontSize:14, border:'none', cursor:'pointer',
                      fontFamily:"'DM Sans',sans-serif",
                      transition:'background 0.2s, transform 0.2s',
                      boxShadow:'0 4px 16px rgba(15,44,74,0.2)',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#F47C20'; e.currentTarget.style.transform='translateY(-2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#0f2c4a'; e.currentTarget.style.transform='translateY(0)';}}>
                    Join the Cause <ArrowRight size={16}/>
                  </button>
                  <button onClick={onReport}
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'13px 26px', borderRadius:14,
                      background:'#fff', color:'#dc2626',
                      fontWeight:800, fontSize:14,
                      border:'2px solid #fecaca', cursor:'pointer',
                      fontFamily:"'DM Sans',sans-serif",
                      transition:'background 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.transform='translateY(-2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#fff'; e.currentTarget.style.transform='translateY(0)';}}>
                    <AlertTriangle size={16}/> Report an Issue
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider topColor="#fff9f2" bottomColor="#fff"/>
    </>
  );
};

export default AboutProgram;
