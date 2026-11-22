import { useState } from 'react'
import { postEntry, uploadPhoto } from '../data'
import { parseSpotify, spotifyEmbed } from '../spotify'
import type { EntryType, Place, Profile } from '../types'

const TABS: { id: EntryType; label: string }[] = [
  { id: 'message', label: 'Mensaje' },
  { id: 'song', label: 'Canción' },
  { id: 'place', label: 'Lugar' },
  { id: 'photo', label: 'Foto' },
]

interface Props {
  uid: string
  profile: Profile
  dailyKey?: string
  onDone: () => void
}

interface SearchResult {
  display_name: string
  name?: string
  lat: string
  lon: string
}

async function nominatim(path: string): Promise<unknown> {
  const r = await fetch(`https://nominatim.openstreetmap.org/${path}&format=json&accept-language=es`)
  if (!r.ok) throw new Error('Búsqueda no disponible')
  return r.json()
}

export function Composer({ uid, profile, dailyKey, onDone }: Props) {
  const [tab, setTab] = useState<EntryType>(dailyKey ? 'photo' : 'message')
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [placeQuery, setPlaceQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const embed = link ? spotifyEmbed(link) : null

  const canPost =
    !busy &&
    ((tab === 'message' && text.trim()) ||
      (tab === 'song' && parseSpotify(link)) ||
      (tab === 'place' && place && place.name.trim()) ||
      (tab === 'photo' && file))

  async function searchPlace() {
    if (!placeQuery.trim()) return
    setError(null)
    try {
      const r = (await nominatim(`search?q=${encodeURIComponent(placeQuery)}&limit=5`)) as SearchResult[]
      setResults(r)
      if (r.length === 0) setError('No encontré ese lugar')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function useMyLocation() {
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        let name = ''
        try {
          const r = (await nominatim(`reverse?lat=${lat}&lon=${lng}&zoom=14`)) as {
            name?: string
            address?: Record<string, string>
          }
          name = r.name || r.address?.suburb || r.address?.town || r.address?.city || r.address?.village || ''
        } catch {
          /* el nombre lo escribe a mano */
        }
        setPlace({ name, lat, lng })
        setResults([])
      },
      () => setError('No pude acceder a tu ubicación'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  async function submit() {
    if (!canPost) return
    setBusy(true)
    setError(null)
    try {
      const note = text.trim() || undefined
      if (tab === 'message') await postEntry(uid, profile, { type: 'message', text: text.trim() })
      if (tab === 'song') await postEntry(uid, profile, { type: 'song', spotifyUrl: link.trim(), text: note })
      if (tab === 'place') await postEntry(uid, profile, { type: 'place', place: place!, text: note })
      if (tab === 'photo') {
        const up = await uploadPhoto(uid, file!)
        await postEntry(uid, profile, { type: 'photo', ...up, text: note, dailyKey })
      }
      onDone()
    } catch (e) {
      setError((e as Error).message || 'No se pudo publicar')
      setBusy(false)
    }
  }

  return (
    <div className="composer">
      <div className="composer-top">
        <button className="link-btn big" onClick={onDone}>
          Cancelar
        </button>
      </div>

      <h1 className="serif composer-title">{dailyKey ? 'Foto del día' : 'Dejale algo'}</h1>

      {!dailyKey && (
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'tab active' : 'tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'message' && (
        <div className="field">
          <label htmlFor="msg" className="eyebrow">
            Mensajito
          </label>
          <textarea id="msg" rows={5} value={text} onChange={(e) => setText(e.target.value)} className="serif-input" autoFocus />
        </div>
      )}

      {tab === 'song' && (
        <>
          <div className="field">
            <label htmlFor="link" className="eyebrow">
              Link de Spotify
            </label>
            <input
              id="link"
              type="url"
              inputMode="url"
              placeholder="https://open.spotify.com/track/…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
          {embed && (
            <iframe title="Vista previa" src={embed.src} height={embed.height} className="embed" allow="encrypted-media" />
          )}
          {link && !embed && <p className="error">Ese link no parece de Spotify</p>}
        </>
      )}

      {tab === 'place' && (
        <>
          <div className="field">
            <label htmlFor="q" className="eyebrow">
              Buscar lugar
            </label>
            <div className="row">
              <input
                id="q"
                value={placeQuery}
                placeholder="Ho'okipa Beach"
                onChange={(e) => setPlaceQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPlace()}
              />
              <button className="btn secondary" onClick={searchPlace}>
                Buscar
              </button>
            </div>
            <button className="link-btn" onClick={useMyLocation}>
              Usar mi ubicación
            </button>
          </div>
          {results.length > 0 && (
            <ul className="results">
              {results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button
                    onClick={() => {
                      setPlace({ name: r.name || r.display_name.split(',')[0], lat: +r.lat, lng: +r.lon })
                      setResults([])
                    }}
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {place && (
            <div className="field">
              <label htmlFor="pname" className="eyebrow">
                Nombre
              </label>
              <input id="pname" value={place.name} onChange={(e) => setPlace({ ...place, name: e.target.value })} />
            </div>
          )}
        </>
      )}

      {tab === 'photo' && (
        <div className="field">
          <label className="photo-pick">
            {preview ? <img src={preview} alt="Vista previa" /> : <span>{dailyKey ? 'Sacá la foto' : 'Elegí una foto'}</span>}
            <input
              type="file"
              accept="image/*"
              {...(dailyKey ? { capture: 'environment' as const } : {})}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setFile(f)
                setPreview(f ? URL.createObjectURL(f) : null)
              }}
            />
          </label>
        </div>
      )}

      {tab !== 'message' && (
        <div className="field">
          <label htmlFor="nota" className="eyebrow">
            Una nota (opcional)
          </label>
          <textarea id="nota" rows={2} value={text} onChange={(e) => setText(e.target.value)} className="serif-input" />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="spacer" />
      <button className="btn primary full" disabled={!canPost} onClick={submit}>
        {busy ? 'Publicando…' : 'Publicar'}
      </button>
    </div>
  )
}
