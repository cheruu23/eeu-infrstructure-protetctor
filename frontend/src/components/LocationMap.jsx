import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom green marker for EEU branding
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Auto-fit map to markers
function FitBounds({ markers }) {
  const map = useMap();
  if (markers.length > 0) {
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }
  return null;
}

/**
 * LocationMap — shows one or multiple markers on an OpenStreetMap
 *
 * Props:
 *   markers: [{ lat, lng, title, description, type: 'report'|'request' }]
 *   height: string (default '300px')
 *   single: bool — if true, shows just one marker centered
 */
export default function LocationMap({ markers = [], height = '300px', single = false }) {
  const validMarkers = markers.filter(m => m.lat && m.lng && !isNaN(m.lat) && !isNaN(m.lng));

  if (validMarkers.length === 0) {
    return (
      <div style={{ height, background: '#f5f5f5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.88rem' }}>
        📍 No location data available
      </div>
    );
  }

  const center = single
    ? [validMarkers[0].lat, validMarkers[0].lng]
    : [9.03, 38.74]; // Addis Ababa default

  return (
    <div style={{ height, borderRadius: 10, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      <MapContainer center={center} zoom={single ? 14 : 11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!single && <FitBounds markers={validMarkers} />}
        {validMarkers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={m.type === 'report' ? orangeIcon : greenIcon}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.title || 'Location'}</div>
                {m.description && <div style={{ fontSize: '0.82rem', color: '#555' }}>{m.description}</div>}
                {m.address && <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>📍 {m.address}</div>}
                {m.status && <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Status: <b>{m.status}</b></div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
