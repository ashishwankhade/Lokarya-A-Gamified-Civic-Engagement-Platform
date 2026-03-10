// src/dashboards/authority/EnhancedMiniMap.jsx
import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const STATUS_COLOR = {
  pending:          '#f59e0b',
  officer_assigned: '#0369a1',
  worker_assigned:  '#7c3aed',
  in_progress:      '#2563eb',
  resolved:         '#059669',
  closed:           '#64748b',
  escalated:        '#dc2626',
};

const EnhancedMiniMap = ({ lat, lng, title, status = 'pending', address }) => {
  if (!lat || !lng) return null;

  const color         = STATUS_COLOR[status] || '#2563eb';
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

      {/* Map — street-level zoom 17 */}
      <MapContainer
        center={[lat, lng]} zoom={17}
        style={{ height: 220, width: '100%' }}
        zoomControl={false} dragging={false}
        scrollWheelZoom={false} doubleClickZoom={false}
        attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <CircleMarker
          center={[lat, lng]} radius={11}
          pathOptions={{ fillColor: color, fillOpacity: 0.92, color: '#fff', weight: 3 }}>
          <Popup closeButton={false}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
              {title || 'Complaint location'}
            </span>
          </Popup>
        </CircleMarker>
      </MapContainer>

      {/* Footer — address + Google Maps link */}
      <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0',
        padding: '10px 14px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12 }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, flex: 1, minWidth: 0 }}>
          <MapPin size={13} style={{ color, flexShrink: 0, marginTop: 1 }} />
          <div style={{ minWidth: 0 }}>
            {address && (
              <p style={{ color: '#475569', fontSize: 12, fontWeight: 600,
                lineHeight: 1.4, margin: 0,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {address}
              </p>
            )}
            <p style={{ color: '#94a3b8', fontSize: 10,
              fontFamily: "'JetBrains Mono',monospace",
              margin: 0, marginTop: address ? 2 : 0 }}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
        </div>

        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
            padding: '6px 11px', borderRadius: 8, background: '#fff',
            border: '1px solid #e2e8f0', color: '#1d4ed8',
            fontSize: 11, fontWeight: 800, textDecoration: 'none',
            fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
          <ExternalLink size={11} /> Open in Maps
        </a>
      </div>

      <style>{`
        .leaflet-popup-content-wrapper { border-radius:8px!important; padding:0!important; }
        .leaflet-popup-content { margin:8px 10px!important; }
      `}</style>
    </div>
  );
};

export default EnhancedMiniMap;
