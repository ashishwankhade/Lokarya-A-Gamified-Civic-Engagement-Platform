/**
 * CreateMission.jsx
 * Create / Edit mission form.
 *
 * Path: src/dashboards/ngo/CreateMission.jsx
 *
 * MAP UPGRADES:
 *  [M1] Address search bar (Nominatim) — type any place and jump to it
 *  [M2] "Use my location" GPS button — one tap to centre on device
 *  [M3] Map tile switcher — Standard / Satellite / Dark
 *  [M4] Radius preview circle — dashed ring shows exact GPS gate
 *  [M5] Reverse geocoding on pin drop — auto-fills location name + address
 *  [M6] Recent pins memory — last 5 used locations for quick re-use
 *  [M7] Larger map (400px) with fullscreen toggle to 560px
 *  [M8] Live coordinates badge updates as pin moves
 *  [M9] Animated pin drop with bounce on placement
 *
 * FIXES:
 *  [F1] File field 'banner' matches multer config
 *  [F2] Event date min = today
 *  [F3] MapPicker key forces remount on editId change
 *  [F4] Search dropdown rendered via React createPortal into document.body —
 *       fully escapes Leaflet stacking context. getBoundingClientRect anchors
 *       it to the search input. scroll + resize listeners keep it tracking.
 *       zIndex set to Number.MAX_SAFE_INTEGER equivalent (2147483647).
 *  [F5] Tiles use fully-labelled OSM data: Standard = openstreetmap.org tiles
 *       (shows all roads, shops, buildings, farms, lakes, POIs, house numbers);
 *       Dark = CartoDB dark_all (labels on); Satellite = Esri unchanged.
 */

import React, {
  useEffect, useState, useRef, useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Zap, FileText, Image, ChevronDown,
  Loader2, CheckCircle2, AlertCircle, Info,
  Settings2, Search, Navigation, Layers,
  Maximize2, Minimize2, Clock,
} from 'lucide-react';
import api      from '../../api/axios';
import { toast } from 'react-toastify';

let L;

const NV    = '#0f2c4a';
const G     = '#059669';
const OR    = '#F47C20';
const TODAY = new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  'Environment', 'Education', 'Healthcare', 'Social',
  'Animal Welfare', 'Sanitation', 'Disaster Relief',
];

/* ── Tile definitions ─────────────────────────────────────────────────────
 *  [F5] Fully-labelled tiles: roads, shops, buildings, farms, lakes, rivers,
 *  house numbers, POIs — everything OpenStreetMap has mapped.
 *  Standard  → OSM official raster tiles (most complete detail)
 *  Satellite → Esri World Imagery (unchanged)
 *  Dark      → CartoDB Dark Matter WITH labels (dark_all)
 * ──────────────────────────────────────────────────────────────────────── */
const TILES = {
  standard: {
    label: 'Standard',
    url:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr:  '© OpenStreetMap contributors',
  },
  satellite: {
    label: 'Satellite',
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr:  '© Esri',
  },
  dark: {
    label: 'Dark',
    url:   'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr:  '© OpenStreetMap © CARTO',
  },
};

/* ── Recent pins (localStorage) ─────────────────────────────────────────── */
const RECENT_KEY    = 'lokarya_recent_pins';
const getRecentPins = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const saveRecentPin = (pin) => {
  const existing = getRecentPins().filter(
    p => !(Math.abs(p.lat - pin.lat) < 0.0001 && Math.abs(p.lng - pin.lng) < 0.0001)
  );
  localStorage.setItem(RECENT_KEY, JSON.stringify([pin, ...existing].slice(0, 5)));
};

/* ── Nominatim helpers ──────────────────────────────────────────────────── */
const reverseGeocode = async (lat, lng) => {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a    = data.address || {};
    const name = a.amenity || a.building || a.leisure || a.tourism
               || a.suburb || a.neighbourhood || a.road || '';
    const address = data.display_name?.split(',').slice(0, 4).join(', ') || '';
    return { name, address };
  } catch { return { name: '', address: '' }; }
};

const forwardGeocode = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return await res.json();
  } catch { return []; }
};

/* ── Form atom components ───────────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label style={{ fontSize: 12, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 6, display: 'block' }}>
    {children}{required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
  </label>
);

const Input = ({ style = {}, ...props }) => (
  <input {...props}
    style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
      border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
      fontFamily: "'DM Sans',sans-serif", color: NV,
      transition: 'border-color 0.2s', background: '#fff',
      boxSizing: 'border-box', ...style }}
    onFocus={e => e.target.style.borderColor = G}
    onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
  />
);

const Textarea = ({ style = {}, ...props }) => (
  <textarea {...props} rows={4}
    style={{ width: '100%', padding: '11px 14px', borderRadius: 12,
      border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
      fontFamily: "'DM Sans',sans-serif", color: NV, resize: 'vertical',
      transition: 'border-color 0.2s', background: '#fff',
      boxSizing: 'border-box', ...style }}
    onFocus={e => e.target.style.borderColor = G}
    onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
  />
);

const SelectField = ({ style = {}, children, ...props }) => (
  <div style={{ position: 'relative' }}>
    <select {...props}
      style={{ width: '100%', padding: '11px 36px 11px 14px',
        borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none',
        fontFamily: "'DM Sans',sans-serif", color: NV,
        appearance: 'none', background: '#fff', cursor: 'pointer',
        boxSizing: 'border-box', ...style }}>
      {children}
    </select>
    <ChevronDown size={16} style={{ position: 'absolute', right: 12,
      top: '50%', transform: 'translateY(-50%)',
      color: '#94a3b8', pointerEvents: 'none' }}/>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, accent = G }) => (
  <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
    overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
    <div style={{ padding: '16px 24px', borderBottom: '2px solid #f0ebe3',
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'linear-gradient(to right, #fafbfc, #fff)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10,
        background: `${accent}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: accent }}/>
      </div>
      <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700,
        fontSize: 16, color: NV }}>{title}</span>
    </div>
    <div style={{ padding: '22px 24px' }}>{children}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   PORTAL DROPDOWN  [F4]
   ─────────────────────────────────────────────────────────────────────────
   Why createPortal?
   Leaflet renders its map inside a <div> that has its own CSS stacking
   context (transform + z-index). Any child of that div — even with
   z-index:9999999 — cannot visually appear above the map tiles.
   By portalling the dropdown into document.body we step completely outside
   that stacking context. The dropdown is then a direct child of <body> and
   nothing can occlude it.

   Positioning is done with getBoundingClientRect() so the panel tracks the
   search input exactly in viewport coordinates regardless of scroll position.
   scroll + resize listeners recompute the position live.
══════════════════════════════════════════════════════════════════════════ */
const PortalDropdown = ({ anchorRef, visible, children }) => {
  const [rect, setRect] = useState(null);

  const recompute = useCallback(() => {
    if (anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect());
    }
  }, [anchorRef]);

  useEffect(() => {
    if (!visible) { setRect(null); return; }
    recompute();
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [visible, recompute]);

  if (!visible || !rect) return null;

  return createPortal(
    <div
      style={{
        position:      'fixed',
        top:           rect.bottom + 6,
        left:          rect.left,
        width:         rect.width,
        zIndex:        2147483647,          /* INT32_MAX — nothing goes above this */
        background:    '#fff',
        borderRadius:  14,
        border:        '2px solid #e2e8f0',
        boxShadow:     '0 24px 56px rgba(0,0,0,0.2)',
        overflow:      'hidden',
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   ENHANCED MAP PICKER
══════════════════════════════════════════════════════════════════════════ */
const MapPicker = ({ lat, lng, radius, onChange, onAddressFound }) => {
  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const markerRef   = useRef(null);
  const circleRef   = useRef(null);
  const tileRef     = useRef(null);
  const debounceRef = useRef(null);

  /* [F4] anchor for the portal dropdown */
  const searchWrapRef = useRef(null);

  const [ready,         setReady]         = useState(false);
  const [fullscreen,    setFullscreen]    = useState(false);
  const [activeTile,    setActiveTile]    = useState('standard');
  const [showTiles,     setShowTiles]     = useState(false);
  const [searchQ,       setSearchQ]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [geocoding,     setGeocoding]     = useState(false);
  const [recentPins,    setRecentPins]    = useState(getRecentPins);
  const [showRecent,    setShowRecent]    = useState(false);

  /* ── Custom animated pin icon ──────────────────────────────────── */
  const makeIcon = useCallback(() => {
    if (!L) return null;
    return L.divIcon({
      html: `
        <style>
          @keyframes pinBounce {
            0%   { transform: rotate(-45deg) translateY(-24px) scale(0.6); opacity: 0; }
            60%  { transform: rotate(-45deg) translateY(4px)  scale(1.08); opacity: 1; }
            80%  { transform: rotate(-45deg) translateY(-3px) scale(0.97); }
            100% { transform: rotate(-45deg) translateY(0)    scale(1);    opacity: 1; }
          }
          .loka-pin { animation: pinBounce 0.4s cubic-bezier(0.34,1.4,0.64,1) both; }
        </style>
        <div style="position:relative;width:36px;height:48px">
          <div class="loka-pin" style="
            width:36px;height:36px;
            border-radius:50% 50% 50% 0;
            background:${G};
            border:3px solid #fff;
            box-shadow:0 4px 18px rgba(5,150,105,0.55);
          "></div>
          <div style="
            position:absolute;bottom:0;left:50%;
            transform:translateX(-50%);
            width:12px;height:5px;
            background:rgba(0,0,0,0.18);
            border-radius:50%;
            filter:blur(2px);
          "></div>
        </div>`,
      iconSize:   [36, 48],
      iconAnchor: [18, 48],
      className:  '',
    });
  }, []);

  /* ── Radius circle ─────────────────────────────────────────────── */
  const syncCircle = useCallback((la, lo, r) => {
    if (!mapInst.current || !L) return;
    const rad = r || 300;
    if (circleRef.current) {
      circleRef.current.setLatLng([la, lo]);
      circleRef.current.setRadius(rad);
    } else {
      circleRef.current = L.circle([la, lo], {
        radius:      rad,
        color:       G,
        fillColor:   G,
        fillOpacity: 0.07,
        weight:      2,
        dashArray:   '7 5',
      }).addTo(mapInst.current);
    }
  }, []);

  useEffect(() => {
    if (circleRef.current && radius) circleRef.current.setRadius(radius);
  }, [radius]);

  /* ── Place / move marker ───────────────────────────────────────── */
  const placeMarker = useCallback((la, lo, fly = true) => {
    if (!mapInst.current || !L) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([la, lo]);
    } else {
      markerRef.current = L.marker([la, lo], {
        icon: makeIcon(), draggable: true, autoPan: true,
      }).addTo(mapInst.current);
      markerRef.current.on('dragend', (e) => {
        const { lat: dla, lng: dlo } = e.target.getLatLng();
        const rla = parseFloat(dla.toFixed(6));
        const rlo = parseFloat(dlo.toFixed(6));
        onChange(rla, rlo);
        syncCircle(rla, rlo, radius);
        doReverseGeocode(rla, rlo);
      });
    }
    syncCircle(la, lo, radius);
    if (fly) mapInst.current.flyTo([la, lo], 16, { duration: 1.1 });
  }, [makeIcon, onChange, radius, syncCircle]); // eslint-disable-line

  /* ── Reverse geocode ───────────────────────────────────────────── */
  const doReverseGeocode = useCallback(async (la, lo) => {
    setGeocoding(true);
    const result = await reverseGeocode(la, lo);
    setGeocoding(false);
    if (onAddressFound) onAddressFound(result);
    saveRecentPin({ lat: la, lng: lo, name: result.name || `${la.toFixed(4)},${lo.toFixed(4)}` });
    setRecentPins(getRecentPins());
  }, [onAddressFound]);

  /* ── Tile switch ───────────────────────────────────────────────── */
  const switchTile = useCallback((key) => {
    if (!mapInst.current || !L) return;
    if (tileRef.current) mapInst.current.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(TILES[key].url, {
      attribution: TILES[key].attr, maxZoom: 19,
    }).addTo(mapInst.current);
    tileRef.current.bringToBack();
    setActiveTile(key);
    setShowTiles(false);
  }, []);

  /* ── Search (debounced 500 ms) ─────────────────────────────────── */
  const handleSearch = useCallback((q) => {
    setSearchQ(q);
    setShowRecent(false);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await forwardGeocode(q);
      setSearchResults(res.slice(0, 5));
      setSearching(false);
    }, 500);
  }, []);

  const pickResult = useCallback((r) => {
    const la = parseFloat(parseFloat(r.lat).toFixed(6));
    const lo = parseFloat(parseFloat(r.lon).toFixed(6));
    onChange(la, lo);
    placeMarker(la, lo);
    doReverseGeocode(la, lo);
    setSearchQ(r.display_name.split(',')[0]);
    setSearchResults([]);
    setShowRecent(false);
  }, [onChange, placeMarker, doReverseGeocode]);

  /* ── GPS locate ────────────────────────────────────────────────── */
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = parseFloat(pos.coords.latitude.toFixed(6));
        const lo = parseFloat(pos.coords.longitude.toFixed(6));
        onChange(la, lo);
        placeMarker(la, lo);
        doReverseGeocode(la, lo);
        setLocating(false);
      },
      () => { toast.error('Could not get your location'); setLocating(false); },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [onChange, placeMarker, doReverseGeocode]);

  /* Invalidate map on fullscreen toggle */
  useEffect(() => {
    setTimeout(() => mapInst.current?.invalidateSize(), 60);
  }, [fullscreen]);

  /* ── Leaflet init ──────────────────────────────────────────────── */
  useEffect(() => {
    if (mapInst.current) return;
    let mounted = true;
    (async () => {
      try {
        L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        if (!mounted || !mapRef.current) return;
        delete L.Icon.Default.prototype._getIconUrl;

        mapInst.current = L.map(mapRef.current, {
          zoomControl:       false,
          attributionControl: false,
        }).setView([lat || 21.1458, lng || 79.0882], lat && lng ? 16 : 13);

        tileRef.current = L.tileLayer(TILES.standard.url, {
          attribution: TILES.standard.attr, maxZoom: 19,
        }).addTo(mapInst.current);

        L.control.zoom({ position: 'bottomright' }).addTo(mapInst.current);
        L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(mapInst.current);

        if (lat && lng) placeMarker(lat, lng, false);

        mapInst.current.on('click', (e) => {
          const la = parseFloat(e.latlng.lat.toFixed(6));
          const lo = parseFloat(e.latlng.lng.toFixed(6));
          onChange(la, lo);
          placeMarker(la, lo);
          doReverseGeocode(la, lo);
        });

        setReady(true);
      } catch (err) { console.error('Leaflet error:', err); }
    })();
    return () => {
      mounted = false;
      mapInst.current?.remove();
      mapInst.current = null;
      markerRef.current = null;
      circleRef.current = null;
      tileRef.current   = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sync coords when parent changes (edit mode) */
  useEffect(() => {
    if (!mapInst.current || !lat || !lng || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    syncCircle(lat, lng, radius);
  }, [lat, lng, radius, syncCircle]);

  const mapH      = fullscreen ? 560 : 400;
  const hasPinned = !!(lat && lng);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .loka-search-btn:hover { background: #f0fdf4 !important; }
        .loka-result-row:hover { background: #f8fafc !important; cursor: pointer; }
      `}</style>

      {/* ── Search row ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8 }}>

        {/* [F4] This div is the portal anchor — getBoundingClientRect() reads from here */}
        <div ref={searchWrapRef} style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute', left: 13, top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
          }}/>
          {searching && (
            <Loader2 size={13} style={{
              position: 'absolute', right: 13, top: '50%',
              transform: 'translateY(-50%)',
              color: G, animation: 'spin 1s linear infinite',
            }}/>
          )}
          <input
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search venue, road, shop, landmark…"
            style={{
              width: '100%', padding: '11px 38px 11px 38px',
              borderRadius: 12, border: '2px solid #e2e8f0',
              fontSize: 14, fontFamily: "'DM Sans',sans-serif",
              color: NV, outline: 'none', background: '#fff',
              transition: 'border-color 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.target.style.borderColor = G;
              if (recentPins.length > 0 && !searchQ.trim()) setShowRecent(true);
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e2e8f0';
              /* 200 ms delay so onMouseDown on a result registers first */
              setTimeout(() => { setShowRecent(false); setSearchResults([]); }, 200);
            }}
          />

          {/* ── Search results portal [F4] ── */}
          <PortalDropdown anchorRef={searchWrapRef} visible={searchResults.length > 0}>
            {searchResults.map((r, i) => (
              <div
                key={i}
                className="loka-result-row"
                onMouseDown={() => pickResult(r)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: '#ecfdf5',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={14} style={{ color: G }}/>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: NV, lineHeight: 1.3 }}>
                    {r.display_name.split(',')[0]}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
                    {r.display_name.split(',').slice(1, 4).join(',')}
                  </div>
                </div>
              </div>
            ))}
          </PortalDropdown>

          {/* ── Recent pins portal [F4] ── */}
          <PortalDropdown
            anchorRef={searchWrapRef}
            visible={showRecent && recentPins.length > 0 && searchResults.length === 0}
          >
            <div style={{
              padding: '9px 16px 7px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Clock size={11} style={{ color: '#94a3b8' }}/>
              <span style={{
                fontSize: 10, fontWeight: 800, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>Recent pins</span>
            </div>
            {recentPins.map((pin, i) => (
              <div
                key={i}
                className="loka-result-row"
                onMouseDown={() => {
                  onChange(pin.lat, pin.lng);
                  placeMarker(pin.lat, pin.lng);
                  setSearchQ(pin.name);
                  setShowRecent(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px',
                  borderBottom: i < recentPins.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: '#ecfdf5',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={13} style={{ color: G }}/>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NV }}>{pin.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </PortalDropdown>
        </div>

        {/* GPS locate button */}
        <button
          onClick={handleLocate}
          disabled={locating}
          className="loka-search-btn"
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
            padding: '0 18px', borderRadius: 12, border: '2px solid #e2e8f0',
            background: '#fff', color: G, fontWeight: 800, fontSize: 13,
            cursor: locating ? 'wait' : 'pointer',
            fontFamily: "'DM Sans',sans-serif",
            whiteSpace: 'nowrap', height: 46, transition: 'background 0.15s',
          }}
        >
          <Navigation size={15} style={{ animation: locating ? 'spin 1s linear infinite' : 'none' }}/>
          {locating ? 'Locating…' : 'My Location'}
        </button>
      </div>

      {/* ── Map box ───────────────────────────────────────────────── */}
      <div style={{
        position:   'relative',
        borderRadius: 16,
        overflow:   'hidden',
        border:     `2px solid ${hasPinned ? G : '#e2e8f0'}`,
        boxShadow:  hasPinned ? `0 0 0 4px ${G}1a` : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <div ref={mapRef} style={{ height: mapH, width: '100%', display: 'block', transition: 'height 0.3s' }}/>

        {/* Loading overlay */}
        {!ready && (
          <div style={{
            position: 'absolute', inset: 0, background: '#f8fafc', zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12,
          }}>
            <Loader2 size={28} style={{ color: G, animation: 'spin 1s linear infinite' }}/>
            <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
              Loading map…
            </span>
          </div>
        )}

        {/* Geocoding pill */}
        <AnimatePresence>
          {geocoding && (
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', top: 14, left: '50%',
                transform: 'translateX(-50%)', zIndex: 25,
                background: '#fff', borderRadius: 999, padding: '7px 16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.13)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: NV,
              }}
            >
              <Loader2 size={12} style={{ color: G, animation: 'spin 1s linear infinite' }}/>
              Getting address…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-right controls */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Fullscreen */}
          <button
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? 'Collapse' : 'Expand map'}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#fff', border: '2px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
            }}
          >
            {fullscreen
              ? <Minimize2 size={15} style={{ color: '#475569' }}/>
              : <Maximize2 size={15} style={{ color: '#475569' }}/>}
          </button>

          {/* Tile switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTiles(t => !t)}
              title="Map style"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#fff', border: `2px solid ${showTiles ? G : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
              }}
            >
              <Layers size={15} style={{ color: showTiles ? G : '#475569' }}/>
            </button>
            <AnimatePresence>
              {showTiles && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  style={{
                    position: 'absolute', top: '110%', right: 0,
                    background: '#fff', borderRadius: 12,
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.13)',
                    overflow: 'hidden', minWidth: 136, zIndex: 30,
                  }}
                >
                  {Object.entries(TILES).map(([key, tile], i) => (
                    <button
                      key={key}
                      onClick={() => switchTile(key)}
                      style={{
                        width: '100%', padding: '9px 14px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: 'none',
                        background: activeTile === key ? '#ecfdf5' : 'none',
                        color:      activeTile === key ? G : NV,
                        fontWeight: activeTile === key ? 800 : 600,
                        fontSize: 13, cursor: 'pointer',
                        fontFamily: "'DM Sans',sans-serif",
                        borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.12s',
                      }}
                    >
                      {activeTile === key && <CheckCircle2 size={12}/>}
                      {tile.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* No-pin hint */}
        {!hasPinned && ready && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              textAlign: 'center', background: 'rgba(255,255,255,0.93)',
              borderRadius: 16, padding: '16px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
            }}>
              <MapPin size={26} style={{ color: G, margin: '0 auto 8px' }}/>
              <p style={{ fontSize: 13, fontWeight: 800, color: NV, margin: 0,
                fontFamily: "'DM Sans',sans-serif" }}>
                Click anywhere to pin the venue
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0',
                fontFamily: "'DM Sans',sans-serif" }}>
                Or search above · drag pin to adjust
              </p>
            </div>
          </motion.div>
        )}

        {/* Live coordinates badge */}
        {hasPinned && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 20,
            background: 'rgba(15,44,74,0.88)', backdropFilter: 'blur(6px)',
            borderRadius: 999, padding: '6px 13px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: '#34d399',
              boxShadow: '0 0 0 3px rgba(52,211,153,0.25)',
            }}/>
            <span style={{
              fontSize: 11, fontWeight: 800, color: '#fff',
              fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.04em',
            }}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      {/* ── Radius info strip ─────────────────────────────────────── */}
      <AnimatePresence>
        {hasPinned && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f0fdf4', borderRadius: 12, padding: '10px 16px',
              border: '1.5px solid #a7f3d0',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px dashed ${G}`, background: `${G}12`,
            }}/>
            <span style={{
              fontSize: 12, color: '#15803d', fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", flex: 1,
            }}>
              Volunteers within <strong>{radius || 300}m</strong> of pin are auto-verified.
              Adjust GPS Radius to resize the circle.
            </span>
            <button
              onClick={() => {
                if (mapInst.current && lat && lng)
                  mapInst.current.flyTo([lat, lng], 16, { duration: 0.8 });
              }}
              style={{
                fontSize: 12, fontWeight: 800, color: G,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                textDecoration: 'underline', textUnderlineOffset: 3, flexShrink: 0,
              }}
            >
              Re-centre
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{
        fontSize: 12, color: '#94a3b8', margin: 0,
        fontFamily: "'DM Sans',sans-serif",
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Info size={12}/>
        Search, click map, or drag pin. Switch to Satellite for aerial view.
      </p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
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

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      setFetching(true);
      try {
        const { data: m } = await api.get(`/activities/${editId}`);
        setForm({
          title:               m.title            || '',
          description:         m.description      || '',
          category:            m.category         || 'Environment',
          pointsReward:        m.pointsReward     || 50,
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
        if (m.banner?.startsWith('http')) setBannerPrev(m.banner);
      } catch { toast.error('Failed to load mission data'); }
      finally   { setFetching(false); }
    };
    load();
  }, [editId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBanner(file);
    setBannerPrev(URL.createObjectURL(file));
  };

  const handleAddressFound = useCallback(({ name, address }) => {
    setForm(p => ({
      ...p,
      locationName:    p.locationName    || name    || p.locationName,
      locationAddress: p.locationAddress || address || p.locationAddress,
    }));
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim())        { toast.error('Mission title is required');        return; }
    if (!form.description.trim())  { toast.error('Description is required');          return; }
    if (!form.date)                { toast.error('Mission date is required');          return; }
    if (!form.deadline)            { toast.error('Registration deadline is required'); return; }
    if (!form.locationName.trim()) { toast.error('Location name is required');         return; }
    if (!form.lat || !form.lng)    { toast.error('Please pin the venue on the map');   return; }
    if (!form.contactInfo.trim())  { toast.error('Contact info is required');          return; }
    if (form.date < TODAY)         { toast.error('Event date cannot be in the past');  return; }
    if (new Date(form.deadline) > new Date(form.date)) {
      toast.error('Deadline cannot be after the event date'); return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',           form.title);
      fd.append('description',     form.description);
      fd.append('category',        form.category);
      fd.append('pointsReward',    form.pointsReward);
      fd.append('date',            form.date);
      fd.append('deadline',        form.deadline);
      fd.append('location',        JSON.stringify({
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
      if (banner) fd.append('banner', banner); // [F1]

      if (isEdit) {
        await api.put(`/activities/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mission updated!');
      } else {
        await api.post('/activities', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mission submitted for admin approval!');
      }
      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save mission');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 0', color: '#94a3b8', fontFamily: "'DM Sans',sans-serif",
    }}>
      <Loader2 size={28} style={{ color: G, marginRight: 12, animation: 'spin 1s linear infinite' }}/>
      Loading mission data…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Fraunces',serif", fontWeight: 900,
              fontSize: 24, color: NV, marginBottom: 4,
            }}>
              {isEdit ? 'Edit Mission' : 'Create New Mission'}
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {isEdit
                ? 'Update mission details below.'
                : 'Fill in the details. Mission goes to admin for approval before going live.'}
            </p>
          </div>
          {!isEdit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef3c7', border: '1.5px solid #fde68a',
              borderRadius: 12, padding: '10px 16px',
            }}>
              <AlertCircle size={15} style={{ color: '#92400e' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                Requires admin approval before going live
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Section 1: Mission Details */}
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
                <SelectField value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </SelectField>
              </div>
              <div>
                <Label required>XP Reward</Label>
                <div style={{ position: 'relative' }}>
                  <Zap size={15} style={{
                    position: 'absolute', left: 13,
                    top: '50%', transform: 'translateY(-50%)', color: OR,
                  }}/>
                  <Input type="number" min={0} max={500}
                    value={form.pointsReward}
                    onChange={e => set('pointsReward', Number(e.target.value))}
                    style={{ paddingLeft: 36 }}/>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
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

      {/* Section 2: Venue & GPS */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard title="Venue & GPS" icon={MapPin} accent="#2563eb">
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label required>Venue Name</Label>
                <Input value={form.locationName}
                  onChange={e => set('locationName', e.target.value)}
                  placeholder="Auto-filled after pin, or type manually"/>
              </div>
              <div>
                <Label>Full Address</Label>
                <Input value={form.locationAddress}
                  onChange={e => set('locationAddress', e.target.value)}
                  placeholder="Auto-filled after pin"/>
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

            {/* [F3] key forces remount on different editId */}
            <MapPicker
              key={`map-${editId || 'new'}`}
              lat={form.lat}
              lng={form.lng}
              radius={form.gpsRadiusMeters}
              onChange={(la, lo) => { set('lat', la); set('lng', lo); }}
              onAddressFound={handleAddressFound}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* Section 3: Banner */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionCard title="Mission Banner" icon={Image} accent={OR}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bannerPrev ? (
              <div style={{
                position: 'relative', borderRadius: 14, overflow: 'hidden',
                height: 180, border: '2px solid #e2e8f0',
              }}>
                <img src={bannerPrev} alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                <button
                  onClick={() => { setBanner(null); setBannerPrev(null); }}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 12, padding: '36px 24px',
                  borderRadius: 14, border: '2px dashed #e2e8f0', cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = ''; }}
              >
                <Image size={32} style={{ color: '#94a3b8' }}/>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, color: NV, fontSize: 14 }}>Click to upload banner</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PNG, JPG up to 5MB · 16:9 recommended</p>
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBanner}/>
              </label>
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* Section 4: Bonus Config */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{
          background: '#fff', borderRadius: 20, border: '2px solid #f0ebe3',
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}>
          <button
            onClick={() => setShowBonus(p => !p)}
            style={{
              width: '100%', padding: '18px 24px', border: 'none', cursor: 'pointer',
              background: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: '#fff0e0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Settings2 size={18} style={{ color: OR }}/>
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{
                  fontFamily: "'Fraunces',serif", fontWeight: 700,
                  fontSize: 16, color: NV, display: 'block',
                }}>Bonus XP Configuration</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Optional — customize point bonuses</span>
              </div>
            </div>
            <ChevronDown size={18} style={{
              color: '#94a3b8',
              transform: showBonus ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.25s',
            }}/>
          </button>
          {showBonus && (
            <div style={{ padding: '4px 24px 24px', borderTop: '2px solid #f0ebe3' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                gap: 14, marginTop: 18,
              }}>
                {[
                  { k: 'earlyBirdMultiplier', label: 'Early Bird Multiplier', hint: '1.2 = 20% bonus for first 24h registrants', min: 1, max: 3, step: 0.1 },
                  { k: 'streakBonus',         label: 'Streak Bonus (XP)',     hint: 'Flat XP per consecutive streak level',      min: 0, max: 100 },
                  { k: 'bringAFriendBonus',   label: 'Bring-a-Friend (XP)',   hint: 'XP if a referred friend also attends',      min: 0, max: 100 },
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

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel} disabled={loading}
            style={{
              padding: '13px 28px', borderRadius: 14,
              border: '2px solid #e2e8f0', background: '#fff', color: '#64748b',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: G, color: '#fff', fontWeight: 800, fontSize: 15,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 4px 16px rgba(5,150,105,0.35)',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            {loading
              ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> Saving…</>
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