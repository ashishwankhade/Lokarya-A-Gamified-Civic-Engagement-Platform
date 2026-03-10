/**
 * XpRuleEngine.jsx
 * Path: src/dashboards/admin/XpRuleEngine.jsx
 *
 * Live-editable XP rule table:
 *  - Toggle enable/disable per rule
 *  - Inline edit: XP amount, cooldown, daily cap
 *  - Category tabs: citizen | ngo | system
 *  - Reset to defaults button
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ToggleLeft, ToggleRight, Save,
  RotateCcw, Loader2, Info, AlertTriangle,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';

const NV = '#0f2c4a';
const V  = '#7c3aed';
const OR = '#F47C20';
const G  = '#059669';

const CAT_META = {
  citizen: { label:'Citizen Actions', color:'#2563eb', bg:'#eff6ff'    },
  ngo:     { label:'NGO Actions',     color:G,         bg:'#ecfdf5'    },
  system:  { label:'System / Admin',  color:V,         bg:'#f5f3ff'    },
};

/* ── INLINE EDIT FIELD ───────────────────────────────────────────────────── */
const EditField = ({ value, onChange, min=0, max=10000, label }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:80 }}>
    <label style={{ fontSize:10, fontWeight:800, color:'#94a3b8',
      textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
    <input type="number" value={value} min={min} max={max}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width:'100%', padding:'7px 10px', borderRadius:9, border:'2px solid #e2e8f0',
        fontSize:14, fontFamily:"'Fraunces',serif", fontWeight:800, color:NV,
        textAlign:'center', outline:'none', transition:'border-color 0.2s' }}
      onFocus={e => e.target.style.borderColor = OR}
      onBlur={e  => e.target.style.borderColor = '#e2e8f0'}/>
  </div>
);

/* ── RULE ROW ────────────────────────────────────────────────────────────── */
const RuleRow = ({ rule, onSave, onToggle, saving, toggling }) => {
  const [xp,          setXp]          = useState(rule.xp);
  const [cooldownHrs, setCooldownHrs] = useState(rule.cooldownHrs);
  const [maxPerDay,   setMaxPerDay]   = useState(rule.maxPerDay);
  const isDirty = xp !== rule.xp || cooldownHrs !== rule.cooldownHrs || maxPerDay !== rule.maxPerDay;

  useEffect(() => {
    setXp(rule.xp);
    setCooldownHrs(rule.cooldownHrs);
    setMaxPerDay(rule.maxPerDay);
  }, [rule]);

  return (
    <motion.div
      animate={{ opacity: rule.enabled ? 1 : 0.45 }}
      style={{ background:'#fff', borderRadius:16, border:`2px solid ${isDirty ? OR : '#f0ebe3'}`,
        padding:'18px 20px', transition:'border-color 0.2s' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>

        {/* label + description */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontWeight:800, fontSize:14, color: rule.enabled ? NV : '#94a3b8' }}>
              {rule.label}
            </span>
            {!rule.enabled && (
              <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:999,
                padding:'2px 8px', fontSize:10, fontWeight:800 }}>DISABLED</span>
            )}
          </div>
          <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>{rule.description}</div>
          <div style={{ fontSize:11, color:'#cbd5e1', marginTop:4,
            fontFamily:"'JetBrains Mono',monospace" }}>{rule.action}</div>
        </div>

        {/* editable fields */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
          <EditField label="XP"         value={xp}          onChange={setXp}          min={0}  max={10000} />
          <EditField label="Cooldown h" value={cooldownHrs} onChange={setCooldownHrs} min={0}  max={8760}  />
          <EditField label="Max/day"    value={maxPerDay}   onChange={setMaxPerDay}   min={0}  max={1000}  />

          {/* Save button */}
          <button onClick={() => onSave(rule._id, { xp, cooldownHrs, maxPerDay })}
            disabled={!isDirty || saving}
            style={{ padding:'7px 14px', borderRadius:9, border:'none', cursor: isDirty ? 'pointer' : 'not-allowed',
              background: isDirty ? OR : '#f1f5f9', color: isDirty ? '#fff' : '#cbd5e1',
              fontWeight:800, fontSize:12, fontFamily:"'DM Sans',sans-serif",
              display:'flex', alignItems:'center', gap:6, transition:'all 0.2s',
              opacity: saving ? 0.6 : 1 }}>
            {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
            Save
          </button>

          {/* Toggle */}
          <button onClick={() => onToggle(rule._id)} disabled={toggling}
            style={{ background:'none', border:'none', cursor:'pointer',
              color: rule.enabled ? G : '#dc2626', opacity: toggling ? 0.5 : 1,
              display:'flex', alignItems:'center', gap:5, fontWeight:800, fontSize:12,
              fontFamily:"'DM Sans',sans-serif" }}>
            {toggling
              ? <Loader2 size={18} className="animate-spin"/>
              : rule.enabled
                ? <ToggleRight size={24} style={{ color:G }}/>
                : <ToggleLeft  size={24} style={{ color:'#dc2626' }}/>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const XpRuleEngine = () => {
  const [rules,      setRules]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('citizen');
  const [savingId,   setSavingId]   = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [resetting,  setResetting]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/xp-rules');
      setRules(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load XP rules'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (id, updates) => {
    setSavingId(id);
    try {
      await api.patch(`/admin/xp-rules/${id}`, updates);
      toast.success('Rule updated!');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed'); }
    finally     { setSavingId(null); }
  };

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      const { data } = await api.patch(`/admin/xp-rules/${id}/toggle`);
      toast.success(data.message);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Toggle failed'); }
    finally     { setTogglingId(null); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset ALL XP rules to factory defaults? This cannot be undone.')) return;
    setResetting(true);
    try {
      const { data } = await api.post('/admin/xp-rules/reset');
      toast.success(data.message);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Reset failed'); }
    finally     { setResetting(false); }
  };

  const filtered = rules.filter(r => r.category === activeTab);
  const totalXp  = rules.filter(r => r.enabled).reduce((s, r) => s + r.xp, 0);
  const disabled = rules.filter(r => !r.enabled).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, fontFamily:"'DM Sans',sans-serif" }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:24, color:NV, marginBottom:4 }}>
            XP Rule Engine
          </h2>
          <p style={{ color:'#64748b', fontSize:14 }}>
            {rules.length} rules · {disabled} disabled · {totalXp} total configurable XP
          </p>
        </div>
        <button onClick={handleReset} disabled={resetting}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
            borderRadius:12, border:'2px solid #fee2e2', background:'#fff',
            color:'#dc2626', fontWeight:800, fontSize:13, cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif", opacity: resetting ? 0.6 : 1 }}>
          {resetting ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={14}/>}
          Reset to Defaults
        </button>
      </div>

      {/* INFO BANNER */}
      <div style={{ background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:14,
        padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:10 }}>
        <Info size={16} style={{ color:'#2563eb', flexShrink:0, marginTop:1 }}/>
        <p style={{ fontSize:13, color:'#1e40af', lineHeight:1.7 }}>
          Changes take effect <strong>immediately</strong> for all new actions.
          Cooldown = min hours between awards for the same user + action.
          Max/day = 0 means unlimited. Admin manual awards bypass all limits.
        </p>
      </div>

      {/* CATEGORY TABS */}
      <div style={{ display:'flex', gap:8, borderBottom:'2px solid #f0ebe3', paddingBottom:0 }}>
        {Object.entries(CAT_META).map(([key, meta]) => {
          const count = rules.filter(r => r.category === key).length;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ padding:'10px 20px', borderRadius:'12px 12px 0 0', cursor:'pointer',
                fontWeight:800, fontSize:13, fontFamily:"'DM Sans',sans-serif",
                border: activeTab===key ? `2px solid #f0ebe3` : '2px solid transparent',
                borderBottom: activeTab===key ? '2px solid #fff' : '2px solid transparent',
                background: activeTab===key ? '#fff' : 'transparent',
                color:       activeTab===key ? meta.color : '#94a3b8',
                marginBottom: activeTab===key ? -2 : 0,
                transition:'all 0.15s' }}>
              {meta.label}
              <span style={{ marginLeft:8, background: activeTab===key ? meta.bg : '#f1f5f9',
                color: activeTab===key ? meta.color : '#94a3b8',
                borderRadius:999, padding:'1px 8px', fontSize:11 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* RULES */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
          gap:10, padding:'60px 0', color:'#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" style={{ color:V }}/>
          <span style={{ fontWeight:700 }}>Loading rules…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', background:'#fff',
          borderRadius:16, border:'2px dashed #e2e8f0' }}>
          <Zap size={32} style={{ color:'#e2e8f0', margin:'0 auto 12px' }}/>
          <p style={{ color:'#94a3b8', fontWeight:700 }}>No rules in this category.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <AnimatePresence>
            {filtered.map(rule => (
              <motion.div key={rule._id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                <RuleRow
                  rule={rule}
                  onSave={handleSave}
                  onToggle={handleToggle}
                  saving={savingId   === rule._id}
                  toggling={togglingId === rule._id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* LEGEND */}
      <div style={{ background:'#f8fafc', borderRadius:14, padding:'14px 18px',
        display:'flex', flexWrap:'wrap', gap:16 }}>
        {[
          { color:OR, label:'Unsaved changes border' },
          { color:G,  label:'Toggle ON (enabled)'    },
          { color:'#dc2626', label:'Toggle OFF (disabled)' },
        ].map((l,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:l.color }}/>
            <span style={{ fontSize:12, color:'#64748b' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default XpRuleEngine;
