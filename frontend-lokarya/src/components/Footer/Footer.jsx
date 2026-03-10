import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook, Twitter, Instagram, Youtube,
  ScanLine, Target, AlertTriangle, Trophy,
  MapPin, Zap, Shield, ArrowRight,
} from 'lucide-react';
import footerLogo from '../../assets/main-icon.png';

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

/* ── small helpers ─────────────────────────────────────────────── */
const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} onClick={scrollToTop}
      style={{ fontFamily: "'DM Sans',sans-serif" }}
      className="text-gray-400 hover:text-[#F47C20] transition-colors duration-200 font-semibold text-sm flex items-center gap-1.5 group">
      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-[#F47C20] transition-colors flex-shrink-0" />
      {children}
    </Link>
  </li>
);

const SocialBtn = ({ Icon, href = '#', label }) => (
  <a href={href} aria-label={label}
    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#F47C20] hover:border-[#F47C20] transition-all duration-200 group">
    <Icon size={16} className="group-hover:scale-110 transition-transform" />
  </a>
);

/* ── mission flow steps ────────────────────────────────────────── */
const STEPS = [
  { icon: Target,   label: 'Register',  desc: 'Join a mission'       },
  { icon: ScanLine, label: 'Scan QR',   desc: 'Check in at venue'    },
  { icon: Zap,      label: 'Earn XP',   desc: 'Get points credited'  },
  { icon: Trophy,   label: 'Level Up',  desc: 'Climb the ranks'      },
];

/* ── nav columns ───────────────────────────────────────────────── */
const NAV_COLS = [
  {
    title: 'Citizen',
    links: [
      { name: 'Mission Board',   path: '/activities'   },
      { name: 'Scan QR at Venue',path: '/scan-qr'      },
      { name: 'Report an Issue', path: '/report-issue' },
      { name: 'Rewards Hub',     path: '/rewards'      },
      { name: 'My Profile',      path: '/profile'      },
    ],
  },
  {
    title: 'Platform',
    links: [
      { name: 'Home',            path: '/'             },
      { name: 'Leaderboard',     path: '/leaderboard'  },
      { name: 'Privacy Policy',  path: '/privacy'      },
      { name: 'Terms of Service',path: '/terms'        },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const Footer = () => (
  <footer style={{ fontFamily: "'DM Sans',sans-serif" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>

    {/* ── Mission flow strip ─────────────────────────────────── */}
    <div style={{ background: '#fffbf5', borderTop: '2px solid #f0ebe3', borderBottom: '2px solid #f0ebe3' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center flex-wrap gap-2">
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 8 }}>
            How it works
          </span>
          {STEPS.map(({ icon: Icon, label, desc }, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#F47C20,#f59e0b)' }}>
                  <Icon size={13} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f1c2e', lineHeight: 1.1 }}>{label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{desc}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight size={14} className="text-gray-300 flex-shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>

    {/* ── Main dark footer ───────────────────────────────────── */}
    <div style={{ background: 'linear-gradient(160deg,#0a1f35 0%,#0f2c4a 60%,#0c2644 100%)' }}>

      {/* dot pattern */}
      <div style={{
        backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '28px 28px',
      }}>
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">

          {/* ── Top grid ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-4">
              <Link to="/" onClick={scrollToTop} className="inline-block mb-5">
                <img src={footerLogo} alt="Lokarya"
                  className="h-14 w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
              </Link>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.8 }}
                className="max-w-xs mb-6">
                Building better communities through transparency, gamified civic engagement, and rapid grievance redressal — powered by Nagpur's citizens.
              </p>

              {/* XP rank teaser */}
              <div style={{
                background: 'rgba(244,124,32,0.1)', border: '1.5px solid rgba(244,124,32,0.2)',
                borderRadius: 14, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,124,32,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={17} style={{ color: '#F47C20' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Start as Civic Scout</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Earn XP → reach Lokarya Legend</div>
                </div>
              </div>

              {/* Social icons */}
              <div className="flex gap-2.5 mt-6">
                <SocialBtn Icon={Facebook}  label="Facebook"  />
                <SocialBtn Icon={Twitter}   label="Twitter"   />
                <SocialBtn Icon={Instagram} label="Instagram" />
                <SocialBtn Icon={Youtube}   label="YouTube"   />
              </div>
            </div>

            {/* Nav columns */}
            {NAV_COLS.map(col => (
              <div key={col.title} className="md:col-span-2">
                <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map(l => <FooterLink key={l.name} to={l.path}>{l.name}</FooterLink>)}
                </ul>
              </div>
            ))}

            {/* QR CTA card */}
            <div className="md:col-span-4">
              <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Attend a Mission
              </h4>

              {/* Steps */}
              <div className="space-y-3 mb-5">
                {[
                  { n: '01', t: 'Register on Mission Board', c: '#2563eb' },
                  { n: '02', t: 'Show up at the venue',      c: '#059669' },
                  { n: '03', t: 'Scan the NGO\'s QR code',   c: '#F47C20' },
                  { n: '04', t: 'XP credited automatically', c: '#7c3aed' },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${s.c}22`, border: `1.5px solid ${s.c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: s.c }}>{s.n}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{s.t}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-2.5">
                <Link to="/activities" onClick={scrollToTop}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl no-underline transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#F47C20,#f59e0b)', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                  <Target size={14} /> Browse Missions
                </Link>
                <Link to="/scan-qr" onClick={scrollToTop}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl no-underline transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                  <ScanLine size={14} /> Scan QR at Venue
                </Link>
              </div>
            </div>
          </div>

          {/* ── Location badge ───────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} style={{ color: '#F47C20', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
              Operating in Nagpur, Maharashtra — all 19 vibhags
            </span>
          </div>

          {/* ── Bottom bar ───────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
              © {new Date().getFullYear()} Lokarya Foundation. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 md:gap-6">
              {[
                { name: 'Privacy Policy',   path: '/privacy' },
                { name: 'Terms of Service', path: '/terms'   },
              ].map(l => (
                <Link key={l.name} to={l.path} onClick={scrollToTop}
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}
                  className="hover:text-white transition-colors no-underline">
                  {l.name}
                </Link>
              ))}
              <a href="#"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}
                className="hover:text-white transition-colors no-underline">
                Sitemap
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
