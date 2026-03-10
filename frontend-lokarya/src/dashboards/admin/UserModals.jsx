/**
 * UserModals.jsx
 * Path: src/dashboards/admin/UserModals.jsx
 *
 * Exports four portal modals used by UserManagement.jsx:
 *   - CreateUserModal  — provisions ngo_admin or local_authority
 *   - AwardXpModal     — manually award XP to any user
 *   - ChangeRoleModal  — change any non-super_admin user's role
 *   - RevokeXpModal    — deduct XP with mandatory reason + audit trail
 *
 * Usage:
 *   import { CreateUserModal, AwardXpModal, ChangeRoleModal, RevokeXpModal } from './UserModals';
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X, UserPlus, Building2, Shield, Eye, EyeOff,
  MapPin, Loader2, CheckCircle2, Zap, RefreshCw, MinusCircle,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const NV = '#0f2c4a';
const V  = '#7c3aed';
const G  = '#059669';
const BL = '#2563eb';
const OR = '#F47C20';
const R  = '#dc2626';

const NAGPUR_VIBHAGS = [
  'Dharampeth', 'Lakadganj', 'Mangalwari', 'Sadar', 'Ashi Nagar',
  'Hanuman Nagar', 'Gandhibagh', 'Nehru Nagar', 'Sukrawari',
  'Besa', 'Hingna', 'Kamptee', 'Kalmeshwar', 'Narkhed',
  'Ramtek', 'Umred', 'Katol', 'Mauda', 'Parseoni',
];

const ROLE_OPTIONS = [
  { value: 'citizen',         label: 'Citizen',       color: BL,        desc: 'Standard platform user' },
  { value: 'ngo_admin',       label: 'NGO Admin',     color: G,         desc: 'Creates and manages missions' },
  { value: 'local_authority', label: 'Authority',     color: '#2563eb', desc: 'Resolves complaints for their ward' },
  { value: 'field_worker',    label: 'Field Worker',  color: '#475569', desc: 'On-ground complaint resolution' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const inputCss = (active, accentColor = V) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', borderRadius: 12,
  border: `2px solid ${active ? accentColor : '#e2e8f0'}`,
  fontSize: 14, fontFamily: "'DM Sans',sans-serif",
  color: NV, outline: 'none', background: '#fff',
  transition: 'border-color 0.2s',
});

const Label = ({ children, required }) => (
  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    display: 'block', marginBottom: 6 }}>
    {children}
    {required && <span style={{ color: R, marginLeft: 3 }}>*</span>}
  </label>
);

// Shared modal shell — handles backdrop, spring animation, scroll
const ModalShell = ({ onClose, busy, children, maxWidth = 520 }) =>
  createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
        onClick={() => { if (!busy) onClose(); }} />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 24,
          padding: 32, maxWidth, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          fontFamily: "'DM Sans',sans-serif" }}>
        {children}
      </motion.div>
    </div>,
    document.body
  );

// Modal header row
const ModalHeader = ({ icon: Icon, iconBg, iconColor, title, sub, onClose, busy }) => (
  <div style={{ display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 13,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <div>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
          fontSize: 20, color: NV, margin: 0, lineHeight: 1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>{sub}</p>}
      </div>
    </div>
    <button onClick={onClose} disabled={busy}
      style={{ background: 'none', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: 4, flexShrink: 0 }}>
      <X size={20} />
    </button>
  </div>
);

// Footer with cancel + primary button
const ModalFooter = ({ onClose, busy, onSubmit, label, color = V, icon: Icon = UserPlus, disabled = false }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
    <button onClick={onClose} disabled={busy}
      style={{ flex: 1, padding: 13, borderRadius: 13,
        border: '2px solid #e2e8f0', background: '#fff', color: '#64748b',
        fontWeight: 800, fontSize: 14, cursor: 'pointer',
        fontFamily: "'DM Sans',sans-serif" }}>
      Cancel
    </button>
    <button onClick={onSubmit} disabled={busy || disabled}
      style={{ flex: 2, padding: 13, borderRadius: 13, border: 'none',
        background: disabled ? '#f1f5f9' : color,
        color: disabled ? '#94a3b8' : '#fff',
        fontWeight: 800, fontSize: 14,
        cursor: (busy || disabled) ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.7 : 1,
        fontFamily: "'DM Sans',sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: disabled ? 'none' : `0 4px 14px ${color}40`,
        transition: 'all 0.2s' }}>
      {busy
        ? <><Loader2 size={16} className="animate-spin" /> Working…</>
        : <><Icon size={16} /> {label}</>}
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ROLE SELECTOR CARD (used in CreateUserModal)
// ─────────────────────────────────────────────────────────────────────────────
const RoleCard = ({ value, selected, onSelect, Icon, label, desc, color, bg }) => (
  <button onClick={() => onSelect(value)}
    style={{ flex: 1, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
      textAlign: 'left', fontFamily: "'DM Sans',sans-serif",
      border: `2px solid ${selected ? color : '#e2e8f0'}`,
      background: selected ? bg : '#fff', transition: 'all 0.18s' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: selected ? `${color}22` : '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} style={{ color: selected ? color : '#94a3b8' }} />
      </div>
      <span style={{ fontWeight: 800, fontSize: 14,
        color: selected ? color : '#64748b', flex: 1 }}>{label}</span>
      {selected && <CheckCircle2 size={15} style={{ color }} />}
    </div>
    <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{desc}</p>
  </button>
);

// ═════════════════════════════════════════════════════════════════════════════
// 1. CREATE USER MODAL
// ═════════════════════════════════════════════════════════════════════════════
export const CreateUserModal = ({ onClose, onCreated }) => {
  const [role,    setRole]    = useState('ngo_admin');
  const [showPw,  setShowPw]  = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [focused, setFocused] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    organizationName: '', vibhag: '', department: '', phone: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const fp  = (id) => ({
    onFocus: () => setFocused(id),
    onBlur:  () => setFocused(''),
    style:   inputCss(focused === id),
  });

  // Reset role-specific fields when switching roles
  const switchRole = (r) => {
    setRole(r);
    setForm(f => ({ ...f, organizationName: '', vibhag: '', department: '' }));
  };

  const submit = async () => {
    if (!form.name.trim())                                      { toast.error('Name is required.');             return; }
    if (!form.email.trim())                                     { toast.error('Email is required.');            return; }
    if (!form.password)                                         { toast.error('Password is required.');         return; }
    if (form.password.length < 8)                              { toast.error('Password must be ≥ 8 chars.');   return; }
    if (role === 'ngo_admin' && !form.organizationName.trim()) { toast.error('Organisation name required.');   return; }
    if (role === 'local_authority' && !form.vibhag)            { toast.error('Please select a vibhag.');       return; }

    setBusy(true);
    try {
      const { data } = await api.post('/admin/users/create', { ...form, role });
      toast.success(data.message);
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Creation failed.');
    } finally { setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose} busy={busy} maxWidth={540}>
      <ModalHeader
        icon={UserPlus} iconBg="#f5f3ff" iconColor={V}
        title="Create Account"
        sub="Provision a privileged platform account"
        onClose={onClose} busy={busy}
      />

      {/* Role selector */}
      <div style={{ marginBottom: 20 }}>
        <Label required>Account Type</Label>
        <div style={{ display: 'flex', gap: 10 }}>
          <RoleCard value="ngo_admin" selected={role === 'ngo_admin'} onSelect={switchRole}
            Icon={Building2} label="NGO Admin" color={G} bg="#ecfdf5"
            desc="Creates missions, manages volunteers, QR attendance" />
          <RoleCard value="local_authority" selected={role === 'local_authority'} onSelect={switchRole}
            Icon={Shield} label="Authority" color={BL} bg="#eff6ff"
            desc="Assigns workers, resolves complaints, manages ward" />
        </div>
      </div>

      {/* Common fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Label required>Full Name</Label>
          <input value={form.name} onChange={set('name')}
            placeholder="e.g. Priya Desai" {...fp('name')} />
        </div>

        <div>
          <Label required>Email Address</Label>
          <input type="email" value={form.email} onChange={set('email')}
            placeholder="e.g. priya@ngonagpur.org" {...fp('email')} />
        </div>

        <div>
          <Label required>Password</Label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              placeholder="Minimum 8 characters"
              onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
              style={{ ...inputCss(focused === 'pw'), paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 13, top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <Label>Phone (optional)</Label>
          <input type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+91 98765 43210" {...fp('phone')} />
        </div>

        {/* NGO-specific */}
        <AnimatePresence>
          {role === 'ngo_admin' && (
            <motion.div key="ngo"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ background: '#ecfdf5', border: '2px solid #a7f3d0',
                borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#065f46',
                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
                  NGO Details
                </p>
                <Label required>Organisation Name</Label>
                <input value={form.organizationName} onChange={set('organizationName')}
                  placeholder="e.g. Nagpur Green Foundation"
                  onFocus={() => setFocused('org')} onBlur={() => setFocused('')}
                  style={inputCss(focused === 'org')} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Authority-specific */}
        <AnimatePresence>
          {role === 'local_authority' && (
            <motion.div key="auth"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe',
                borderRadius: 14, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#1e40af',
                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Authority Details
                </p>
                <div>
                  <Label required>Vibhag / Ward</Label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={13} style={{ position: 'absolute', left: 13,
                      top: '50%', transform: 'translateY(-50%)', color: '#94a3b8',
                      pointerEvents: 'none' }} />
                    <select value={form.vibhag} onChange={set('vibhag')}
                      onFocus={() => setFocused('vibhag')} onBlur={() => setFocused('')}
                      style={{ ...inputCss(focused === 'vibhag'), paddingLeft: 34, cursor: 'pointer' }}>
                      <option value="">Select vibhag…</option>
                      {NAGPUR_VIBHAGS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Department (optional)</Label>
                  <input value={form.department} onChange={set('department')}
                    placeholder="e.g. Roads & Infrastructure"
                    onFocus={() => setFocused('dept')} onBlur={() => setFocused('')}
                    style={inputCss(focused === 'dept')} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ModalFooter
        onClose={onClose} busy={busy} onSubmit={submit}
        label="Create Account" color={V} icon={UserPlus}
      />
    </ModalShell>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. AWARD XP MODAL
// ═════════════════════════════════════════════════════════════════════════════
export const AwardXpModal = ({ user, onClose, onDone }) => {
  const [xp,   setXp]   = useState(50);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!xp || xp <= 0) { toast.error('Enter a positive XP amount'); return; }
    setBusy(true);
    try {
      await api.post(`/admin/users/${user._id}/award-xp`, { xp, note });
      toast.success(`Awarded ${xp} XP to ${user.name}!`);
      onDone();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally     { setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose} busy={busy} maxWidth={380}>
      <ModalHeader
        icon={Zap} iconBg="#fef3c7" iconColor="#d97706"
        title="Award XP" sub={`to ${user.name}`}
        onClose={onClose} busy={busy}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Label>XP Amount</Label>
          <input type="number" min={1} value={xp}
            onChange={e => setXp(Number(e.target.value))}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
              border: '2px solid #e2e8f0', fontSize: 24,
              fontFamily: "'Fraunces',serif", fontWeight: 900,
              color: OR, outline: 'none', textAlign: 'center' }}
            onFocus={e => e.target.style.borderColor = '#d97706'}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[10, 25, 50, 100].map(v => (
            <button key={v} onClick={() => setXp(v)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                border: `2px solid ${xp === v ? '#d97706' : '#e2e8f0'}`,
                background: xp === v ? '#fef3c7' : '#fff',
                color: xp === v ? '#d97706' : '#94a3b8',
                transition: 'all 0.15s' }}>
              +{v}
            </button>
          ))}
        </div>

        <div>
          <Label>Reason (optional)</Label>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. Community cleanup leader"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
              border: '2px solid #e2e8f0', fontSize: 14,
              fontFamily: "'DM Sans',sans-serif", color: NV, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#d97706'}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />
        </div>
      </div>

      <ModalFooter
        onClose={onClose} busy={busy} onSubmit={submit}
        label={`Award ${xp} XP`} color="#d97706" icon={Zap}
      />
    </ModalShell>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. CHANGE ROLE MODAL
// ═════════════════════════════════════════════════════════════════════════════
export const ChangeRoleModal = ({ user, onClose, onDone }) => {
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (role === user.role) { toast.info('No change — same role selected.'); return; }
    setBusy(true);
    try {
      await api.patch(`/admin/users/${user._id}/role`, { role });
      toast.success(`${user.name}'s role updated to ${role.replace(/_/g, ' ')}.`);
      onDone();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally     { setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose} busy={busy} maxWidth={420}>
      <ModalHeader
        icon={RefreshCw} iconBg="#f0fdf4" iconColor={G}
        title="Change Role" sub={`Currently: ${user.name}`}
        onClose={onClose} busy={busy}
      />

      {/* Current role badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
        background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Current role:</span>
        <span style={{ background: '#e2e8f0', color: '#475569', borderRadius: 999,
          padding: '3px 10px', fontSize: 11, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {user.role.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Role options */}
      <Label required>New Role</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ROLE_OPTIONS.map(opt => {
          const selected = role === opt.value;
          return (
            <button key={opt.value} onClick={() => setRole(opt.value)}
              style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 13, cursor: 'pointer',
                textAlign: 'left', fontFamily: "'DM Sans',sans-serif",
                border: `2px solid ${selected ? opt.color : '#e2e8f0'}`,
                background: selected ? `${opt.color}10` : '#fff',
                transition: 'all 0.15s' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: selected ? opt.color : '#e2e8f0',
                boxShadow: selected ? `0 0 0 3px ${opt.color}30` : 'none',
                transition: 'all 0.2s' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14,
                  color: selected ? opt.color : NV }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{opt.desc}</div>
              </div>
              {selected && <CheckCircle2 size={16} style={{ color: opt.color, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Warning if changing away from privileged role */}
      {(user.role === 'ngo_admin' || user.role === 'local_authority') && role !== user.role && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 14, background: '#fef3c7', border: '2px solid #fde68a',
            borderRadius: 12, padding: '10px 14px',
            fontSize: 12, color: '#92400e', fontWeight: 700, lineHeight: 1.6 }}>
          ⚠️ Changing from a privileged role will remove their dashboard access immediately.
        </motion.div>
      )}

      <ModalFooter
        onClose={onClose} busy={busy} onSubmit={submit}
        label="Update Role" color={G} icon={RefreshCw}
      />
    </ModalShell>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. REVOKE XP MODAL
// ═════════════════════════════════════════════════════════════════════════════
export const RevokeXpModal = ({ user, onClose, onDone }) => {
  const [xp,     setXp]     = useState('');
  const [reason, setReason] = useState('');
  const [busy,   setBusy]   = useState(false);
  const [focused, setFocused] = useState('');

  const parsedXp       = Number(xp);
  const validXp        = xp !== '' && !isNaN(parsedXp) && parsedXp > 0;
  const previewBalance = validXp ? Math.max(0, (user.xp || 0) - parsedXp) : null;
  const willFloor      = validXp && parsedXp > (user.xp || 0);
  const canSubmit      = validXp && reason.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/users/${user._id}/revoke-xp`, {
        xp: parsedXp,
        reason: reason.trim(),
      });
      toast.success(data.message);
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Revoke failed.');
    } finally { setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose} busy={busy} maxWidth={400}>
      <ModalHeader
        icon={MinusCircle} iconBg="#fef2f2" iconColor={R}
        title="Revoke XP" sub={`from ${user.name}`}
        onClose={onClose} busy={busy}
      />

      {/* Warning banner */}
      <div style={{ background: '#fef2f2', border: `1.5px solid #fecaca`, borderRadius: 12,
        padding: '10px 14px', marginBottom: 18,
        fontSize: 12, fontWeight: 600, color: '#991b1b', lineHeight: 1.6 }}>
        ⚠ Deducts XP and writes an audit entry to the ledger.
        The user will be notified. XP cannot go below 0.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Current → After preview */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, background: '#f8fafc', borderRadius: 14, padding: '14px 20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Current</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
              fontSize: 28, color: OR, lineHeight: 1 }}>{user.xp || 0}</div>
          </div>

          <AnimatePresence>
            {previewBalance !== null && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 22, color: '#cbd5e1', lineHeight: 1 }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>After</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                    fontSize: 28, color: previewBalance === 0 ? R : NV, lineHeight: 1 }}>
                    {previewBalance}
                  </div>
                  {willFloor && (
                    <div style={{ fontSize: 10, color: R, fontWeight: 700, marginTop: 3 }}>
                      floored to 0
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* XP amount input */}
        <div>
          <Label required>XP to Revoke</Label>
          <input type="number" value={xp}
            onChange={e => setXp(e.target.value)}
            min={1} placeholder="e.g. 50"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
              border: `2px solid ${focused === 'xp' ? R : '#e2e8f0'}`,
              fontSize: 26, fontFamily: "'Fraunces',serif", fontWeight: 900,
              color: R, outline: 'none', textAlign: 'center', boxSizing: 'border-box',
              transition: 'border-color 0.2s' }}
            onFocus={() => setFocused('xp')}
            onBlur={() => setFocused('')} />
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[10, 25, 50, 100].map(v => (
            <button key={v} onClick={() => setXp(String(v))}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                border: `2px solid ${parsedXp === v ? R : '#e2e8f0'}`,
                background: parsedXp === v ? '#fef2f2' : '#fff',
                color: parsedXp === v ? R : '#94a3b8',
                transition: 'all 0.15s' }}>
              -{v}
            </button>
          ))}
        </div>

        {/* Reason — required */}
        <div>
          <Label required>Reason</Label>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            rows={2} placeholder="e.g. Duplicate complaint spam, system correction…"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12,
              border: `2px solid ${focused === 'reason' ? R : '#e2e8f0'}`,
              fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: NV,
              resize: 'none', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s' }}
            onFocus={() => setFocused('reason')}
            onBlur={() => setFocused('')} />
        </div>
      </div>

      {/* Custom footer — red CTA */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={onClose} disabled={busy}
          style={{ flex: 1, padding: 13, borderRadius: 13,
            border: '2px solid #e2e8f0', background: '#fff', color: '#64748b',
            fontWeight: 800, fontSize: 14, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif" }}>
          Cancel
        </button>
        <button onClick={submit} disabled={busy || !canSubmit}
          style={{ flex: 2, padding: 13, borderRadius: 13, border: 'none',
            background: canSubmit ? R : '#f1f5f9',
            color: canSubmit ? '#fff' : '#94a3b8',
            fontWeight: 800, fontSize: 14,
            cursor: (!canSubmit || busy) ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: canSubmit ? `0 4px 14px ${R}35` : 'none',
            transition: 'all 0.2s' }}>
          {busy
            ? <><Loader2 size={16} className="animate-spin" /> Revoking…</>
            : <><MinusCircle size={16} /> Revoke XP</>}
        </button>
      </div>
    </ModalShell>
  );
};
