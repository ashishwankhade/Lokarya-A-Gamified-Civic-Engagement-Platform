/**
 * profileTokens.js
 * Shared design tokens, tier system, and utility functions for ProfilePage.
 * Path: src/pages/profile/profileTokens.js
 */

import { Shield, Star, Zap, Award, Crown } from 'lucide-react';

// ── Brand tokens ──────────────────────────────────────────────────────────────
export const NV  = '#0f2c4a';
export const OR  = '#F47C20';
export const BG  = '#fffbf5';
export const FF  = "'DM Sans', sans-serif";
export const SF  = "'Fraunces', serif";

// ── Tier system ───────────────────────────────────────────────────────────────
export const TIERS = [
  { level:1, rank:'Civic Scout',    minXp:0,    Icon:Shield, color:'#64748b', bar:'#94a3b8', bg:'#f1f5f9' },
  { level:2, rank:'Urban Guardian', minXp:200,  Icon:Star,   color:'#2563eb', bar:'#3b82f6', bg:'#eff6ff' },
  { level:3, rank:'Impact Maker',   minXp:500,  Icon:Zap,    color:'#059669', bar:'#10b981', bg:'#ecfdf5' },
  { level:4, rank:'City Champion',  minXp:1000, Icon:Award,  color:'#7c3aed', bar:'#8b5cf6', bg:'#f5f3ff' },
  { level:5, rank:'Lokarya Legend', minXp:2000, Icon:Crown,  color:'#d97706', bar:'#f59e0b', bg:'#fef3c7' },
];

export const getTier     = (xp=0) => [...TIERS].reverse().find(t=>xp>=t.minXp) || TIERS[0];
export const getNextTier = (xp=0) => TIERS.find(t=>t.minXp>xp) || null;
export const getProgress = (xp=0) => {
  const cur=getTier(xp); const next=getNextTier(xp);
  if(!next) return 100;
  return Math.min(100, Math.round(((xp-cur.minXp)/(next.minXp-cur.minXp))*100));
};

// ── Status styles (shared by ActivityPanel) ───────────────────────────────────
export const STATUS_STYLE = {
  completed: { bg:'#ecfdf5', c:'#059669' },
  resolved:  { bg:'#ecfdf5', c:'#059669' },
  pending:   { bg:'#fef9c3', c:'#ca8a04' },
  rejected:  { bg:'#fef2f2', c:'#dc2626' },
  default:   { bg:'#eff6ff', c:'#2563eb' },
};
