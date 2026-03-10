/**
 * XpToastLayer.jsx
 * Path: src/components/shared/XpToastLayer.jsx
 *
 * Renders floating "+N XP" toasts in the bottom-right corner.
 * Mount ONCE at the app root (e.g. in App.jsx), pass toasts + dismissToast
 * from AuthContext.
 *
 * Usage in App.jsx:
 *   import XpToastLayer from './components/shared/XpToastLayer';
 *   const { xpToasts, dismissToast } = useAuth();
 *   <XpToastLayer toasts={xpToasts} onDismiss={dismissToast} />
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, TrendingUp } from 'lucide-react';

const OR = '#F47C20';
const NV = '#0f2c4a';

// Tier-up colors
const TIER_COLORS = {
  'Urban Guardian': '#2563eb',
  'Impact Maker':   '#059669',
  'City Champion':  '#7c3aed',
  'Lokarya Legend': '#d97706',
};

const XpToast = ({ toast, onDismiss }) => {
  const { id, amount, label, leveledUp, action } = toast;

  if (leveledUp) {
    // Full-width tier-up celebration toast
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0,  scale: 1   }}
        exit={{    opacity: 0, y: 20, scale: 0.9  }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'linear-gradient(135deg,#0f2c4a 0%,#1e3a5f 100%)',
          border: `2px solid ${OR}`,
          borderRadius: 18, padding: '14px 18px',
          boxShadow: `0 8px 32px rgba(244,124,32,0.35)`,
          cursor: 'pointer', minWidth: 280, maxWidth: 340,
          fontFamily: "'DM Sans', sans-serif",
          position: 'relative',
        }}
        onClick={() => onDismiss(id)}>

        {/* Animated star burst */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `radial-gradient(circle, ${OR}40 0%, transparent 70%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-ring 1.5s infinite',
        }}>
          <span style={{ fontSize: 28 }}>🏆</span>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 15, color: OR, margin: 0, lineHeight: 1.2 }}>
            Level Up!
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '3px 0 0', fontWeight: 600 }}>
            {label} · <span style={{ color: OR, fontWeight: 800 }}>+{amount} XP</span>
          </p>
        </div>

        <button onClick={e => { e.stopPropagation(); onDismiss(id); }}
          style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 2 }}>
          <X size={13} />
        </button>
      </motion.div>
    );
  }

  // Standard XP toast
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.85 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.85  }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff',
        border: `1.5px solid ${OR}30`,
        borderLeft: `4px solid ${OR}`,
        borderRadius: 14, padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(15,44,74,0.12)',
        cursor: 'pointer', minWidth: 220, maxWidth: 300,
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
      }}
      onClick={() => onDismiss(id)}>

      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: '#fff5ee',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Zap size={18} fill={OR} style={{ color: OR }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: "'Fraunces', serif", fontWeight: 900,
            fontSize: 22, color: OR, lineHeight: 1,
          }}>
            +{amount}
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            XP
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </p>
      </div>

      <button onClick={e => { e.stopPropagation(); onDismiss(id); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 2, flexShrink: 0 }}>
        <X size={13} />
      </button>
    </motion.div>
  );
};

const XpToastLayer = ({ toasts = [], onDismiss }) => (
  <>
    <style>{`
      @keyframes pulse-ring {
        0%   { box-shadow: 0 0 0 0    rgba(244,124,32,0.55); }
        70%  { box-shadow: 0 0 0 12px rgba(244,124,32,0);    }
        100% { box-shadow: 0 0 0 0    rgba(244,124,32,0);    }
      }
    `}</style>
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 99999,
      display: 'flex', flexDirection: 'column-reverse', gap: 10,
      alignItems: 'flex-end',
      pointerEvents: toasts.length ? 'auto' : 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <XpToast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  </>
);

export default XpToastLayer;
