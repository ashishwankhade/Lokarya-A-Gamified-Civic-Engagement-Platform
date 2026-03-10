/**
 * ProfileStyles.jsx
 * All CSS for ProfilePage — responsive breakpoints, animations, utilities.
 * Path: src/pages/profile/ProfileStyles.jsx
 */

import React from 'react';
import { OR, NV, BG } from './profileTokens';

const ProfileStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,0,900;9..144,1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');

    .pp-wrap * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes pp-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pp-pulse {
      0%,100% { opacity:1; } 50% { opacity:0.5; }
    }
    @keyframes pp-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }

    /* Input focus */
    .pp-input:focus {
      border-color: ${OR} !important;
      box-shadow: 0 0 0 3px ${OR}22 !important;
      outline: none;
    }

    /* ── Profile card (left column, sticky desktop) ── */
    .pp-sidebar { position: sticky; top: 88px; }

    /* ── Main two-column grid ── */
    .pp-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 24px;
      align-items: start;
    }

    /* ── Tab nav (mobile panel switcher) ── */
    .pp-tab-nav {
      display: none;
    }

    /* ── Panels ── */
    .pp-panel { display: flex; flex-direction: column; gap: 20px; }

    /* ── Stats row ── */
    .pp-stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    /* ── Badge grid ── */
    .pp-badge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
      gap: 10px;
    }

    /* ── Avatar hover overlay ── */
    .pp-av-ov {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(15,44,74,0.5);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
    }
    .pp-av-wrap:hover .pp-av-ov { opacity: 1; }

    /* ── Edit modal ── */
    .pp-modal-card {
      position: relative; z-index: 1;
      background: #fff; border-radius: 28px;
      width: 100%; max-width: 500px; overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.3);
    }
    .pp-modal-body {
      display: flex; flex-direction: row;
      gap: 28px; align-items: flex-start;
      padding: 8px 28px 32px;
    }

    /* ── Mobile tab panel show/hide ──
       JS adds pp-panel-hide to inactive panels.
       On desktop >640px, ALL panels always show. ── */
    @media (max-width: 640px) {
      .pp-panel-hide { display: none !important; }
    }

    /* ── Filter tabs (badges) ── */
    .pp-filter-tab {
      padding: 5px 14px; border-radius: 999px; border: none;
      cursor: pointer; font-weight: 800; font-size: 11px;
      transition: all 0.15s;
    }
    .pp-filter-tab:not(.active):hover { background: #f0ebe3 !important; }

    /* ── Activity item hover ── */
    .pp-act-item { transition: background 0.15s; border-radius: 14px; }
    .pp-act-item:hover { background: ${BG} !important; }

    /* ── Skeleton shimmer ── */
    .pp-skeleton {
      background: linear-gradient(90deg, #f0ebe3 25%, #fffbf5 50%, #f0ebe3 75%);
      background-size: 200% auto;
      animation: pp-shimmer 1.4s linear infinite;
      border-radius: 10px;
    }

    /* ════════════════════════════════
       TABLET ≤ 900px
    ════════════════════════════════ */
    @media (max-width: 900px) {
      .pp-layout {
        grid-template-columns: 1fr !important;
      }
      .pp-sidebar {
        position: static !important;
      }
      /* Sidebar card goes horizontal */
      .pp-profile-card-inner {
        flex-direction: row !important;
        text-align: left !important;
        gap: 28px !important;
      }
      .pp-profile-card-ring { flex-shrink: 0; }
      .pp-profile-card-info { flex: 1; min-width: 0; }
      .pp-profile-card-cta  { justify-content: flex-start !important; }
      .pp-stats-row {
        grid-template-columns: repeat(4,1fr) !important;
      }
    }

    /* ════════════════════════════════
       MOBILE ≤ 640px
    ════════════════════════════════ */
    @media (max-width: 640px) {
      /* Show tab nav, hide multi-panel */
      .pp-tab-nav   { display: flex !important; }
      .pp-panel-hide { display: none !important; }

      /* Profile card back to centered column */
      .pp-profile-card-inner {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }
      .pp-profile-card-cta { justify-content: center !important; }

      /* Stats 2-col */
      .pp-stats-row {
        grid-template-columns: repeat(2,1fr) !important;
      }

      /* Hero chips */
      .pp-hero-chips { gap: 8px !important; flex-wrap: wrap !important; }
      .pp-hero-chip  { padding: 9px 14px !important; }
      .pp-hero-chip-val { font-size: 16px !important; }

      /* Edit modal → bottom sheet */
      .pp-modal-card {
        border-radius: 24px 24px 0 0 !important;
        position: fixed !important;
        bottom: 0 !important; left: 0 !important; right: 0 !important;
        max-width: 100% !important;
        max-height: 94vh !important;
        overflow-y: auto !important;
      }
      .pp-modal-wrap {
        align-items: flex-end !important;
        padding: 0 !important;
      }
      .pp-modal-body {
        flex-direction: column !important;
        align-items: center !important;
        padding: 8px 20px 36px !important;
      }
      .pp-modal-fields { width: 100%; }

      /* Page pad */
      .pp-page-pad { padding-left: 14px !important; padding-right: 14px !important; }

      /* Badge grid tighter */
      .pp-badge-grid {
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)) !important;
      }
    }

    /* ════════════════════════════════
       TINY ≤ 380px
    ════════════════════════════════ */
    @media (max-width: 380px) {
      .pp-stats-row { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
      .pp-hero-chips { flex-direction: column !important; align-items: stretch !important; }
      .pp-badge-grid { grid-template-columns: repeat(3,1fr) !important; }
    }
  `}</style>
);

export default ProfileStyles;
