/**
 * UserManagement.jsx
 * Path: src/dashboards/admin/UserManagement.jsx
 *
 * Modals live in ./UserModals.jsx — this file is purely
 * the table + filters + pagination logic.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, ShieldOff, Zap, MinusCircle, Trash2,
  ChevronLeft, ChevronRight, Users, Loader2,
  CheckCircle2, XCircle, UserPlus, RefreshCw,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';
import { CreateUserModal, AwardXpModal, ChangeRoleModal, RevokeXpModal } from './UserModals';

const NV = '#0f2c4a';
const V  = '#7c3aed';
const OR = '#F47C20';
const G  = '#059669';
const BL = '#2563eb';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_META = {
  citizen:         { label: 'Citizen',      bg: '#eff6ff', c: BL       },
  local_authority: { label: 'Authority',    bg: '#ecfdf5', c: G        },
  ngo_admin:       { label: 'NGO Admin',    bg: '#fff0e0', c: '#d97706' },
  super_admin:     { label: 'Super Admin',  bg: '#f5f3ff', c: V        },
  field_worker:    { label: 'Field Worker', bg: '#f1f5f9', c: '#475569' },
};

const ROLE_FILTERS = ['all', 'citizen', 'local_authority', 'ngo_admin', 'super_admin', 'field_worker'];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const RoleChip = ({ role }) => {
  const m = ROLE_META[role] || { label: role, bg: '#f1f5f9', c: '#475569' };
  return (
    <span style={{ background: m.bg, color: m.c, borderRadius: 999,
      padding: '3px 10px', fontSize: 11, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {m.label}
    </span>
  );
};

// Icon action button
const ActionBtn = ({ onClick, disabled, title, bg, color, children }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    style={{ padding: '7px 10px', borderRadius: 9, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: bg, color, opacity: disabled ? 0.5 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.15s' }}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const UserManagement = () => {
  const [users,       setUsers]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [search,      setSearch]      = useState('');
  const [roleF,       setRoleF]       = useState('all');
  const [loading,     setLoading]     = useState(true);
  const [acting,      setActing]      = useState(null);   // userId being mutated

  // modal state
  const [showCreate,  setShowCreate]  = useState(false);
  const [awardUser,   setAwardUser]   = useState(null);
  const [revokeUser,  setRevokeUser]  = useState(null);   // ← NEW
  const [roleUser,    setRoleUser]    = useState(null);

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search)          params.set('search', search);
      if (roleF !== 'all') params.set('role',   roleF);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { toast.error('Failed to load users'); }
    finally  { setLoading(false); }
  }, [page, search, roleF]);

  useEffect(() => { load(); },     [load]);
  useEffect(() => { setPage(1); }, [search, roleF]);

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const handleBan = async (user) => {
    setActing(user._id);
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/ban`);
      toast.success(data.message);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally     { setActing(null); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    setActing(user._id);
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deleted.');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally     { setActing(null); }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateUserModal
            onClose={() => setShowCreate(false)}
            onCreated={load}
          />
        )}
        {awardUser && (
          <AwardXpModal
            user={awardUser}
            onClose={() => setAwardUser(null)}
            onDone={() => { setAwardUser(null); load(); }}
          />
        )}
        {/* ── NEW ── */}
        {revokeUser && (
          <RevokeXpModal
            user={revokeUser}
            onClose={() => setRevokeUser(null)}
            onDone={() => { setRevokeUser(null); load(); }}
          />
        )}
        {roleUser && (
          <ChangeRoleModal
            user={roleUser}
            onClose={() => setRoleUser(null)}
            onDone={() => { setRoleUser(null); load(); }}
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
            fontSize: 24, color: NV, margin: 0 }}>Users</h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            {total} registered accounts
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 13, border: 'none',
            background: V, color: '#fff', fontWeight: 800, fontSize: 14,
            cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <UserPlus size={16} /> Create Account
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 12,
              border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
              fontFamily: "'DM Sans',sans-serif", color: NV }}
            onFocus={e => e.target.style.borderColor = V}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'} />
        </div>
        {/* Role filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ROLE_FILTERS.map(r => (
            <button key={r} onClick={() => setRoleF(r)}
              style={{ padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 800, fontSize: 11, fontFamily: "'DM Sans',sans-serif",
                border:     roleF === r ? 'none' : '2px solid #e2e8f0',
                background: roleF === r ? NV     : '#fff',
                color:      roleF === r ? '#fff' : '#64748b',
                transition: 'all 0.15s', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {r === 'all' ? 'All Roles' : r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
        overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '60px 0', color: '#94a3b8' }}>
            <Loader2 size={22} className="animate-spin" style={{ color: V }} />
            <span style={{ fontWeight: 700 }}>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Users size={40} style={{ color: '#e2e8f0', margin: '0 auto 14px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 14 }}>
              No users found.
            </p>
            {(roleF === 'ngo_admin' || roleF === 'local_authority') && (
              <button onClick={() => setShowCreate(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', borderRadius: 11, border: 'none',
                  background: V, color: '#fff', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                <UserPlus size={14} />
                Create first {roleF === 'ngo_admin' ? 'NGO Admin' : 'Authority'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f0ebe3' }}>
                  {['User', 'Role', 'XP', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 16px',
                      textAlign: h === 'User' ? 'left' : 'center',
                      fontSize: 11, fontWeight: 800, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      fontFamily: "'DM Sans',sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const initials = u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                  const isBusy   = acting === u._id;
                  const isSA     = u.role === 'super_admin';
                  return (
                    <motion.tr key={u._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid #f1f5f9' }}>

                      {/* User */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: u.banned
                              ? '#fee2e2'
                              : 'linear-gradient(135deg,#7c3aed,#4c1d95)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden' }}>
                            {u.avatar
                              ? <img src={u.avatar} alt={u.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{initials}</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13,
                              color: u.banned ? '#dc2626' : NV }}>
                              {u.name}{u.banned && ' 🚫'}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                            {u.organizationName && (
                              <div style={{ fontSize: 10, color: G, fontWeight: 700, marginTop: 1 }}>
                                🏢 {u.organizationName}
                              </div>
                            )}
                            {u.vibhag && (
                              <div style={{ fontSize: 10, color: BL, fontWeight: 700, marginTop: 1 }}>
                                📍 {u.vibhag}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <RoleChip role={u.role} />
                      </td>

                      {/* XP */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
                          fontSize: 16, color: OR }}>{u.xp || 0}</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {u.banned
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#fee2e2', color: '#dc2626', borderRadius: 999,
                              padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
                              <XCircle size={11} /> Banned
                            </span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#ecfdf5', color: '#059669', borderRadius: 999,
                              padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
                              <CheckCircle2 size={11} /> Active
                            </span>}
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '14px 16px', textAlign: 'center',
                        fontSize: 12, color: '#94a3b8' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN',
                          { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>

                          {/* Award XP */}
                          <ActionBtn onClick={() => setAwardUser(u)} disabled={isBusy}
                            title="Award XP" bg="#fef3c7" color="#d97706">
                            <Zap size={14} />
                          </ActionBtn>

                          {/* Revoke XP ← NEW */}
                          <ActionBtn onClick={() => setRevokeUser(u)} disabled={isBusy}
                            title="Revoke XP" bg="#fef2f2" color="#dc2626">
                            <MinusCircle size={14} />
                          </ActionBtn>

                          {/* Change Role */}
                          {!isSA && (
                            <ActionBtn onClick={() => setRoleUser(u)} disabled={isBusy}
                              title="Change Role" bg="#f5f3ff" color={V}>
                              <RefreshCw size={14} />
                            </ActionBtn>
                          )}

                          {/* Ban / Unban */}
                          {!isSA && (
                            <ActionBtn
                              onClick={() => handleBan(u)} disabled={isBusy}
                              title={u.banned ? 'Unban' : 'Ban'}
                              bg={u.banned ? '#ecfdf5' : '#fee2e2'}
                              color={u.banned ? '#059669' : '#dc2626'}>
                              {isBusy
                                ? <Loader2 size={14} className="animate-spin" />
                                : u.banned ? <ShieldOff size={14} /> : <Shield size={14} />}
                            </ActionBtn>
                          )}

                          {/* Delete */}
                          {!isSA && (
                            <ActionBtn onClick={() => handleDelete(u)} disabled={isBusy}
                              title="Delete user" bg="#f1f5f9" color="#64748b">
                              <Trash2 size={14} />
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: page === 1 ? '#cbd5e1' : '#475569',
              fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
            Page {page} of {pages}
          </span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: page === pages ? '#cbd5e1' : '#475569',
              fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
