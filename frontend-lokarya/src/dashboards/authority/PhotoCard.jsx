// src/dashboards/authority/PhotoCard.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, X } from 'lucide-react';

/* ── Lightbox ──────────────────────────────────────────────────────────────── */
const Lightbox = ({ src, onClose }) =>
  createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.img
        src={src} alt="Full size"
        initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', objectFit: 'contain' }} />
      <button onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
          borderRadius: '50%', width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <X size={18} />
      </button>
    </motion.div>,
    document.body
  );

/* ── PhotoCard ─────────────────────────────────────────────────────────────── */
/**
 * Props:
 *  src          — image URL (full or relative path)
 *  label        — section label, e.g. "Citizen's Evidence Photo"
 *  icon         — lucide icon component
 *  accentColor  — e.g. '#d97706'
 *  accentBg     — e.g. '#fffbeb'
 *  accentBorder — e.g. '#fde68a'
 *  badge        — small pill text, e.g. "Filed with complaint"
 */
const PhotoCard = ({ src, label, icon: Icon, accentColor, accentBg, accentBorder, badge }) => {
  const [lightbox, setLightbox] = useState(false);
  const [hovered,  setHovered]  = useState(false);

  if (!src) return null;

  return (
    <>
      <AnimatePresence>
        {lightbox && <Lightbox src={src} onClose={() => setLightbox(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 16px', borderBottom: '1px solid #f1f5f9', background: accentBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon && <Icon size={14} style={{ color: accentColor }} />}
            <span style={{ fontSize: 11, fontWeight: 800, color: accentColor,
              textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
          </div>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 700, color: accentColor,
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${accentBorder}`, borderRadius: 999,
              padding: '2px 9px' }}>
              {badge}
            </span>
          )}
        </div>

        {/* Image */}
        <div
          style={{ position: 'relative', cursor: 'zoom-in' }}
          onClick={() => setLightbox(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}>

          <img src={src} alt={label}
            style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block',
              transition: 'filter 0.2s',
              filter: hovered ? 'brightness(0.82)' : 'brightness(1)' }} />

          {/* Zoom pill — always visible */}
          <div style={{ position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.55)', borderRadius: 7,
            padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'opacity 0.2s', opacity: hovered ? 1 : 0.7 }}>
            <ZoomIn size={11} style={{ color: '#fff' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Tap to expand</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PhotoCard;