/**
 * ProfileCard.jsx
 * Left sidebar — avatar ring, XP bar, tier, location/email, edit CTA.
 * Path: src/pages/profile/ProfileCard.jsx
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Edit3, Share2, Camera } from 'lucide-react';
import { NV, OR, BG, FF, SF, TIERS, getTier, getNextTier, getProgress } from './profileTokens';

const ProfileCard = ({ user, xp, onEdit }) => {
  const tier     = getTier(xp);
  const nextTier = getNextTier(xp);
  const progress = getProgress(xp);
  const TierIcon = tier.Icon;

  const R    = 52;
  const circ = 2 * Math.PI * R;
  const off  = circ - (progress / 100) * circ;

  return (
    <div className="pp-sidebar"
      style={{ background:'#fff', borderRadius:24, border:'2px solid #f0ebe3',
        padding:'28px 24px', boxShadow:'0 4px 28px rgba(15,44,74,0.07)',
        fontFamily:FF }}>

      <div className="pp-profile-card-inner"
        style={{ display:'flex', flexDirection:'column',
          alignItems:'center', textAlign:'center', gap:0 }}>

        {/* ── Avatar ring ── */}
        <div className="pp-profile-card-ring"
          style={{ position:'relative', width:148, height:148,
            margin:'0 auto 0', flexShrink:0 }}>

          <svg width="148" height="148"
            style={{ transform:'rotate(-90deg)', position:'absolute', inset:0 }}>
            <circle cx="74" cy="74" r={R}
              stroke="#f0ebe3" strokeWidth="6" fill="none"/>
            <motion.circle cx="74" cy="74" r={R}
              stroke={tier.bar} strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: off }}
              transition={{ duration:1.3, ease:'easeOut' }}/>
          </svg>

          {/* Avatar */}
          <div className="pp-av-wrap"
            style={{ position:'absolute', inset:0, display:'flex',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer' }}
            onClick={onEdit}>
            <div style={{ width:108, height:108, borderRadius:'50%', overflow:'hidden',
              border:'4px solid #fff', boxShadow:'0 4px 18px rgba(15,44,74,0.13)' }}>
              <img src={user.image} alt={user.name}
                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f2c4a&color=fff&size=108`; }}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
            <div className="pp-av-ov">
              <Camera size={22} color="#fff"/>
            </div>
          </div>

          {/* Tier pill */}
          <div style={{ position:'absolute', bottom:2, left:'50%',
            transform:'translateX(-50%)', whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
            background:NV, borderRadius:999, padding:'4px 11px',
            border:'3px solid #fff', boxShadow:'0 2px 10px rgba(15,44,74,0.25)' }}>
            <TierIcon size={9} style={{ color:tier.color }}/>
            <span style={{ fontSize:9, fontWeight:900, color:'#fff',
              textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {tier.rank}
            </span>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="pp-profile-card-info"
          style={{ marginTop:18, minWidth:0, width:'100%' }}>

          <h2 style={{ fontFamily:SF, fontWeight:900, fontSize:22,
            color:NV, lineHeight:1.15, marginBottom:3 }}>
            {user.name}
          </h2>
          <p style={{ fontSize:10, fontWeight:800, color:OR,
            textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:20 }}>
            {user.role}
          </p>

          {/* XP Progress block */}
          <div style={{ background:BG, borderRadius:16, padding:'14px 16px',
            border:'1.5px solid #f0ebe3', marginBottom:16 }}>

            <div style={{ display:'flex', alignItems:'flex-end',
              justifyContent:'space-between', marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:SF, fontWeight:900,
                  fontSize:28, color:OR, lineHeight:1 }}>
                  {xp.toLocaleString()}
                </div>
                <div style={{ fontSize:9, fontWeight:800, color:'#94a3b8',
                  textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>
                  Total XP
                </div>
              </div>
              {nextTier && (
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>
                    {(nextTier.minXp - xp).toLocaleString()} to go
                  </div>
                  <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', marginTop:1 }}>
                    → {nextTier.rank}
                  </div>
                </div>
              )}
            </div>

            {/* Bar */}
            <div style={{ height:6, background:'#e2e8f0',
              borderRadius:999, overflow:'hidden' }}>
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${progress}%` }}
                transition={{ duration:1.3, ease:'easeOut' }}
                style={{ height:'100%', borderRadius:999,
                  background:`linear-gradient(to right,${tier.bar},${OR})` }}/>
            </div>

            {/* Tier dots */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
              {TIERS.map(t => (
                <div key={t.level}
                  style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', gap:3 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%',
                    background: xp >= t.minXp ? t.color : '#e2e8f0',
                    transition:'background 0.3s',
                    boxShadow: xp >= t.minXp ? `0 0 6px ${t.color}60` : 'none' }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Location + email */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {[
              { Icon: MapPin, text: user.location || 'Location not set' },
              { Icon: Mail,   text: user.email,   truncate: true },
            ].map(({ Icon, text, truncate }, i) => (
              <div key={i}
                style={{ display:'flex', alignItems:'center', gap:10,
                  background:'#f8fafc', borderRadius:12, padding:'10px 14px' }}>
                <Icon size={13} style={{ color:OR, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:'#475569', fontWeight:600,
                  overflow: truncate ? 'hidden' : 'visible',
                  textOverflow: truncate ? 'ellipsis' : 'clip',
                  whiteSpace: truncate ? 'nowrap' : 'normal',
                  minWidth:0 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pp-profile-card-cta"
            style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={onEdit}
              style={{ flex:1, display:'flex', alignItems:'center',
                justifyContent:'center', gap:7,
                padding:'11px 16px', borderRadius:13, border:'none',
                background:NV, color:'#fff', fontFamily:FF,
                fontWeight:800, fontSize:13, cursor:'pointer',
                boxShadow:`0 4px 16px ${NV}30`, transition:'all 0.2s',
                maxWidth:190 }}>
              <Edit3 size={14}/> Edit Profile
            </button>
            <button
              style={{ width:42, height:42, borderRadius:13, flexShrink:0,
                border:'1.5px solid #f0ebe3', background:'#f8fafc',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='#f0ebe3'}
              onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
              <Share2 size={15} style={{ color:'#64748b' }}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
