/**
 * CreateMission.jsx
 * Create / Edit mission form.
 * - GPS lat/lng required (Leaflet map picker)
 * - Bonus config panel (early bird, streak, bring-a-friend)
 * - Edit mode: pre-fills from API when editId is provided
 *
 * Path: src/dashboards/ngo/CreateMission.jsx
 *
 * FIXES applied:
 *  [1] File field renamed from 'image' to 'banner' to match multer config
 *  [2] Event date input now has min = today (prevents past dates)
 *  [3] MapPicker receives a key prop so it remounts on a different editId
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Calendar, Users, Zap, FileText,
  Phone, Tag, Image, ChevronDown, Loader2,
  CheckCircle2, AlertCircle, Info, Settings2,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';

/* leaflet loaded lazily to avoid SSR issues */
let L;

const NV = '#0f2c4a';
const G  = '#059669';
const OR = '#F47C20';

const CATEGORIES = [
  'Environment', 'Education', 'Healthcare', 'Social',
  'Animal Welfare', 'Sanitation', 'Disaster Relief',
];

/* today's date string for min= attribute */
const TODAY = new Date().toISOString().slice(0, 10);

/* ── tiny form helpers ───────────────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
    display: 'block' }}>
    {children}{required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
  </label>
);

const Input = ({ style = {}, ...props }) => (
  <input {...props}
    style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
      border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
      fontFamily: "'DM Sans',sans-serif", color: NV,
      transition: 'border-color 0.2s', background: '#fff', ...style }}
    onFocus={e => e.target.style.borderColor = G}
    onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
  />
);

const Textarea = ({ style = {}, ...props }) => (
  <textarea {...props} rows={4}
    style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
      border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
      fontFamily: "'DM Sans',sans-serif", color: NV, resize: 'vertical',
      transition: 'border-color 0.2s', background: '#fff', ...style }}
    onFocus={e => e.target.style.borderColor = G}
    onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
  />
);

const Select = ({ style = {}, children, ...props }) => (
  <div style={{ position: 'relative' }}>
    <select {...props}
      style={{ width: '100%', padding: '11px 36px 11px 14px',
        borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
        fontFamily: "'DM Sans',sans-serif", color: NV,
        appearance: 'none', background: '#fff', cursor: 'pointer', ...style }}>
      {children}
    </select>
    <ChevronDown size={16} style={{ position: 'absolute', right: 12,
      top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}/>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, accent = G }) => (
  <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
    overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
    <div style={{ padding: '16px 24px', borderBottom: '2px solid #f0ebe3',
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'linear-gradient(to right, #fafbfc, #fff)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10,
        background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: accent }}/>
      </div>
      <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700,
        fontSize: 16, color: NV }}>{title}</span>
    </div>
    <div style={{ padding: '22px 24px' }}>{children}</div>
  </div>
);

/* ── MAP PICKER (Leaflet) ────────────────────────────────────────────────── */
const MapPicker = ({ lat, lng, onChange }) => {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markerRef   = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapInstance.current) return;
    (async () => {
      try {
        L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const defaultLat = lat || 21.1458;
        const defaultLng = lng || 79.0882;

        mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView(
          [defaultLat, defaultLng], 14
        );

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        const greenIcon = L.divIcon({
          html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;
            background:${G};border:3px solid #fff;
            box-shadow:0 3px 12px rgba(0,0,0,0.3);
            transform:rotate(-45deg)"></div>`,
          iconSize:   [28, 28],
          iconAnchor: [14, 28],
          className:  '',
        });

        if (lat && lng) {
          markerRef.current = L.marker([lat, lng], { icon: greenIcon, draggable: true })
            .addTo(mapInstance.current);
          markerRef.current.on('dragend', (e) => {
            const { lat: la, lng: lo } = e.target.getLatLng();
            onChange(parseFloat(la.toFixed(6)), parseFloat(lo.toFixed(6)));
          });
        }

        mapInstance.current.on('click', (e) => {
          const { lat: la, lng: lo } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([la, lo]);
          } else {
            markerRef.current = L.marker([la, lo], { icon: greenIcon, draggable: true })
              .addTo(mapInstance.current);
            markerRef.current.on('dragend', (ev) => {
              const { lat: dla, lng: dlo } = ev.target.getLatLng();
              onChange(parseFloat(dla.toFixed(6)), parseFloat(dlo.toFixed(6)));
            });
          }
          onChange(parseFloat(la.toFixed(6)), parseFloat(lo.toFixed(6)));
        });

        setReady(true);
      } catch (err) {
        console.error('Leaflet load error:', err);
      }
    })();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* sync external lat/lng to marker when parent updates inputs */
  useEffect(() => {
    if (!mapInstance.current || !lat || !lng) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
  }, [lat, lng]);

  return (
    <div>
      <div ref={mapRef} style={{ height: 280, borderRadius: 14, overflow: 'hidden',
        border: '2px solid #e2e8f0', zIndex: 1 }}/>
      {!ready && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8',
          fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
          <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }}/>
          Loading map…
        </div>
      )}
      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8,
        fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
        <Info size={12}/> Click on the map or drag the pin to set venue location
      </p>
    </div>
  );
};

/* ── MAIN ────────────────────────────────────────────────────────────────── */
const CreateMission = ({ editId, onSuccess, onCancel }) => {
  const isEdit = Boolean(editId);

  const [form, setForm] = useState({
    title:               '',
    description:         '',
    category:            'Environment',
    pointsReward:        50,
    date:                '',
    deadline:            '',
    locationName:        '',
    locationAddress:     '',
    lat:                 null,
    lng:                 null,
    maxParticipants:     20,
    requirements:        '',
    contactInfo:         '',
    gpsRadiusMeters:     300,
    earlyBirdMultiplier: 1.2,
    streakBonus:         10,
    bringAFriendBonus:   15,
  });
  const [banner,     setBanner]     = useState(null);
  const [bannerPrev, setBannerPrev] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [showBonus,  setShowBonus]  = useState(false);

  /* prefill for edit */
  useEffect(() => {
    if (!editId) return;
    const fetch = async () => {
      setFetching(true);
      try {
        const { data: m } = await api.get(`/activities/${editId}`);
        setForm({
          title:               m.title           || '',
          description:         m.description     || '',
          category:            m.category        || 'Environment',
          pointsReward:        m.pointsReward    || 50,
          date:                m.date     ? m.date.slice(0, 10)     : '',
          deadline:            m.deadline ? m.deadline.slice(0, 10) : '',
          locationName:        m.location?.name    || '',
          locationAddress:     m.location?.address || '',
          lat:                 m.location?.lat     || null,
          lng:                 m.location?.lng     || null,
          maxParticipants:     m.maxParticipants   || 20,
          requirements:        Array.isArray(m.requirements) ? m.requirements.join(', ') : '',
          contactInfo:         m.contactInfo       || '',
          gpsRadiusMeters:     m.gpsRadiusMeters   || 300,
          earlyBirdMultiplier: m.bonusConfig?.earlyBirdMultiplier || 1.2,
          streakBonus:         m.bonusConfig?.streakBonus         || 10,
          bringAFriendBonus:   m.bonusConfig?.bringAFriendBonus   || 15,
        });
        if (m.banner && m.banner.startsWith('http')) setBannerPrev(m.banner);
      } catch { toast.error('Failed to load mission data'); }
      finally   { setFetching(false); }
    };
    fetch();
  }, [editId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBanner(file);
    setBannerPrev(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    /* client-side validation */
    if (!form.title.trim())        { toast.error('Mission title is required');        return; }
    if (!form.description.trim())  { toast.error('Description is required');          return; }
    if (!form.date)                { toast.error('Mission date is required');          return; }
    if (!form.deadline)            { toast.error('Registration deadline is required'); return; }
    if (!form.locationName.trim()) { toast.error('Location name is required');         return; }
    if (!form.lat || !form.lng)    { toast.error('Please pick the venue on the map');  return; }
    if (!form.contactInfo.trim())  { toast.error('Contact info is required');          return; }

    /* FIX [2]: event date must be today or future */
    if (form.date < TODAY) {
      toast.error('Event date cannot be in the past');
      return;
    }

    if (new Date(form.deadline) > new Date(form.date)) {
      toast.error('Deadline cannot be after the event date');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',          form.title);
      fd.append('description',    form.description);
      fd.append('category',       form.category);
      fd.append('pointsReward',   form.pointsReward);
      fd.append('date',           form.date);
      fd.append('deadline',       form.deadline);
      fd.append('location',       JSON.stringify({
        name:    form.locationName,
        address: form.locationAddress,
        lat:     form.lat,
        lng:     form.lng,
      }));
      fd.append('maxParticipants', form.maxParticipants);
      fd.append('requirements',    form.requirements);
      fd.append('contactInfo',     form.contactInfo);
      fd.append('gpsRadiusMeters', form.gpsRadiusMeters);
      fd.append('bonusConfig',     JSON.stringify({
        earlyBirdMultiplier: form.earlyBirdMultiplier,
        streakBonus:         form.streakBonus,
        bringAFriendBonus:   form.bringAFriendBonus,
      }));
      /* FIX [1]: field name must match multer config — 'banner' not 'image' */
      if (banner) fd.append('banner', banner);

      if (isEdit) {
        await api.put(`/activities/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Mission updated!');
      } else {
        await api.post('/activities', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Mission submitted for admin approval!');
      }
      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save mission');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 0', color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>
      <Loader2 size={28} className="animate-spin" style={{ color: G, marginRight: 12 }}/>
      Loading mission data…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22,
      fontFamily: "'DM Sans',sans-serif" }}>

      {/* header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900,
              fontSize: 24, color: NV, marginBottom: 4 }}>
              {isEdit ? 'Edit Mission' : 'Create New Mission'}
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {isEdit
                ? 'Update mission details below.'
                : 'Fill in the details. Mission goes to admin for approval before going live.'}
            </p>
          </div>
          {!isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef3c7', border: '1.5px solid #fde68a',
              borderRadius: 12, padding: '10px 16px' }}>
              <AlertCircle size={15} style={{ color: '#92400e' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                Requires admin approval before going live
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── SECTION 1: Basic Info ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SectionCard title="Mission Details" icon={FileText}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <Label required>Mission Title</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Ambazari Lake Cleanup Drive"/>
            </div>
            <div>
              <Label required>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the mission, what volunteers will do, what to bring…"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label required>Category</Label>
                <Select value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label required>XP Reward</Label>
                <div style={{ position: 'relative' }}>
                  <Zap size={15} style={{ position: 'absolute', left: 13,
                    top: '50%', transform: 'translateY(-50%)', color: OR }}/>
                  <Input type="number" min={0} max={500}
                    value={form.pointsReward}
                    onChange={e => set('pointsReward', Number(e.target.value))}
                    style={{ paddingLeft: 36 }}/>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                {/* FIX [2]: min = today prevents past dates */}
                <Label required>Event Date</Label>
                <Input type="date" min={TODAY}
                  value={form.date} onChange={e => set('date', e.target.value)}/>
              </div>
              <div>
                <Label required>Registration Deadline</Label>
                <Input type="date" min={TODAY}
                  value={form.deadline} onChange={e => set('deadline', e.target.value)}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label required>Max Volunteers</Label>
                <Input type="number" min={1} max={5000}
                  value={form.maxParticipants}
                  onChange={e => set('maxParticipants', Number(e.target.value))}/>
              </div>
              <div>
                <Label required>Contact Info</Label>
                <Input value={form.contactInfo} onChange={e => set('contactInfo', e.target.value)}
                  placeholder="+91 98xxx or email"/>
              </div>
            </div>
            <div>
              <Label>Requirements (comma separated)</Label>
              <Input value={form.requirements} onChange={e => set('requirements', e.target.value)}
                placeholder="e.g. Wear gloves, Bring water bottle"/>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* ── SECTION 2: Venue + GPS ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard title="Venue & GPS" icon={MapPin} accent="#2563eb">
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label required>Venue Name</Label>
                <Input value={form.locationName} onChange={e => set('locationName', e.target.value)}
                  placeholder="e.g. Ambazari Garden Gate No. 2"/>
              </div>
              <div>
                <Label>Full Address</Label>
                <Input value={form.locationAddress} onChange={e => set('locationAddress', e.target.value)}
                  placeholder="Street, Nagpur"/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <Label required>Latitude</Label>
                <Input type="number" step="0.000001"
                  value={form.lat || ''}
                  onChange={e => set('lat', parseFloat(e.target.value) || null)}
                  placeholder="21.1458"/>
              </div>
              <div>
                <Label required>Longitude</Label>
                <Input type="number" step="0.000001"
                  value={form.lng || ''}
                  onChange={e => set('lng', parseFloat(e.target.value) || null)}
                  placeholder="79.0882"/>
              </div>
              <div>
                <Label>GPS Radius (metres)</Label>
                <Input type="number" min={50} max={2000}
                  value={form.gpsRadiusMeters}
                  onChange={e => set('gpsRadiusMeters', Number(e.target.value))}/>
              </div>
            </div>

            <div style={{ background: '#eff6ff', borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              border: '1.5px solid #bfdbfe' }}>
              <Info size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: 1 }}/>
              <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.7 }}>
                <strong>GPS is required</strong> for volunteer attendance verification. Volunteers scanning QR
                within <strong>{form.gpsRadiusMeters}m</strong> of the pin are auto-verified.
                {form.lat && form.lng && (
                  <> Pin set at <strong>{form.lat}, {form.lng}</strong>.</>
                )}
              </p>
            </div>

            {/* FIX [3]: key forces remount when switching between edit missions */}
            <MapPicker
              key={`map-${editId || 'new'}-${form.lat}-${form.lng}`}
              lat={form.lat}
              lng={form.lng}
              onChange={(la, lo) => { set('lat', la); set('lng', lo); }}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* ── SECTION 3: Banner ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionCard title="Mission Banner" icon={Image} accent={OR}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bannerPrev ? (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden',
                height: 180, border: '2px solid #e2e8f0' }}>
                <img src={bannerPrev} alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                <button onClick={() => { setBanner(null); setBannerPrev(null); }}
                  style={{ position: 'absolute', top: 10, right: 10,
                    background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'DM Sans',sans-serif" }}>
                  Remove
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, padding: '36px 24px',
                borderRadius: 14, border: '2px dashed #e2e8f0',
                cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = ''; }}>
                <Image size={32} style={{ color: '#94a3b8' }}/>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, color: NV, fontSize: 14 }}>Click to upload banner</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PNG, JPG up to 5MB · 16:9 recommended</p>
                </div>
                {/* FIX [1]: onChange stores file; FormData uses 'banner' key */}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBanner}/>
              </label>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* ── SECTION 4: Bonus Config (collapsible) ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>

          <button onClick={() => setShowBonus(p => !p)}
            style={{ width: '100%', padding: '18px 24px', border: 'none', cursor: 'pointer',
              background: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10,
                background: '#fff0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 size={18} style={{ color: OR }}/>
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700,
                  fontSize: 16, color: NV, display: 'block' }}>Bonus XP Configuration</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Optional — customize point bonuses</span>
              </div>
            </div>
            <ChevronDown size={18} style={{ color: '#94a3b8',
              transform: showBonus ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.25s' }}/>
          </button>

          {showBonus && (
            <div style={{ padding: '4px 24px 24px', borderTop: '2px solid #f0ebe3' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                gap: 14, marginTop: 18 }}>
                {[
                  { k: 'earlyBirdMultiplier', label: 'Early Bird Multiplier', hint: '1.2 = 20% bonus for first 24h registrants', min: 1, max: 3, step: 0.1 },
                  { k: 'streakBonus',         label: 'Streak Bonus (XP)',     hint: 'Flat XP added per consecutive mission streak level', min: 0, max: 100 },
                  { k: 'bringAFriendBonus',   label: 'Bring-a-Friend (XP)',   hint: 'XP if a referred friend also attends', min: 0, max: 100 },
                ].map(({ k, label, hint, ...rest }) => (
                  <div key={k}>
                    <Label>{label}</Label>
                    <Input type="number" value={form[k]}
                      onChange={e => set(k, Number(e.target.value))} {...rest}/>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, lineHeight: 1.5 }}>{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={onCancel} disabled={loading}
            style={{ padding: '13px 28px', borderRadius: 14,
              border: '2px solid #e2e8f0', background: '#fff', color: '#64748b',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: G, color: '#fff', fontWeight: 800, fontSize: 15,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 4px 16px rgba(5,150,105,0.35)',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.2s, box-shadow 0.2s' }}>
            {loading
              ? <><Loader2 size={18} className="animate-spin"/> Saving…</>
              : isEdit
                ? <><CheckCircle2 size={18}/> Save Changes</>
                : <><CheckCircle2 size={18}/> Submit for Approval</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateMission;