import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import { FEED_TZ } from '../config'
import { dateKey, prettyDate, tripDay } from '../time'
import type { Entry } from '../types'

const ACCENT = '#2F6F6A'
const TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const ATTR = '&copy; OpenStreetMap &copy; CARTO'

function dayLabel(e: Entry) {
  const key = dateKey(e.createdAt?.toDate() ?? new Date(), FEED_TZ)
  const d = tripDay(key)
  return d >= 1 ? `Día ${d}` : prettyDate(key)
}

export function MapView({ entries }: { entries: Entry[] }) {
  // entries vienen de más nuevo a más viejo
  const places = entries.filter((e) => e.type === 'place' && e.place)
  const chrono = [...places].reverse()
  const line = chrono.map((e) => [e.place!.lat, e.place!.lng] as [number, number])
  const center: [number, number] = line.length ? line[line.length - 1] : [20.8, -156.33] // Maui

  return (
    <div className="mapview">
      <header className="map-header">
        <h1 className="serif">Su recorrido</h1>
        <span className="muted small">
          {places.length} {places.length === 1 ? 'lugar' : 'lugares'}
        </span>
      </header>

      <div className="map-box">
        <MapContainer center={center} zoom={line.length ? 10 : 8} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer url={TILES} attribution={ATTR} />
          {line.length > 1 && <Polyline positions={line} pathOptions={{ color: ACCENT, weight: 2, dashArray: '4 6' }} />}
          {chrono.map((e, i) => (
            <CircleMarker
              key={e.id}
              center={[e.place!.lat, e.place!.lng]}
              radius={i === chrono.length - 1 ? 8 : 6}
              pathOptions={{
                color: '#FBF8F3',
                weight: 3,
                fillColor: i === chrono.length - 1 ? '#1F1D1A' : ACCENT,
                fillOpacity: 1,
              }}
            >
              <Tooltip>{e.place!.name}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <ul className="place-list">
        {places.map((e) => (
          <li key={e.id}>
            <span className="serif place-name">{e.place!.name}</span>
            <span className="muted small">{dayLabel(e)}</span>
          </li>
        ))}
        {places.length === 0 && <li className="muted">Todavía no hay lugares.</li>}
      </ul>
    </div>
  )
}

export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={11}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={TILES} />
      <CircleMarker center={[lat, lng]} radius={7} pathOptions={{ color: '#FBF8F3', weight: 3, fillColor: ACCENT, fillOpacity: 1 }} />
    </MapContainer>
  )
}
