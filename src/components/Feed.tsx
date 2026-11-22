import { CITIES, FEED_TZ } from '../config'
import { removeEntry } from '../data'
import { spotifyEmbed } from '../spotify'
import { dateKey, prettyDate, timeIn, tripDay } from '../time'
import type { Entry } from '../types'
import { MiniMap } from './MapView'

type Item = { kind: 'entry'; entry: Entry } | { kind: 'daily'; key: string; photos: Entry[] }

interface Group {
  key: string
  items: Item[]
  placeName?: string
}

function groupEntries(entries: Entry[]): Group[] {
  const groups: Group[] = []
  const byKey = new Map<string, Group>()
  const dailySeen = new Set<string>()

  for (const e of entries) {
    const date = e.createdAt?.toDate() ?? new Date()
    const key = dateKey(date, FEED_TZ)
    let g = byKey.get(key)
    if (!g) {
      g = { key, items: [] }
      byKey.set(key, g)
      groups.push(g)
    }
    if (e.type === 'place' && e.place && !g.placeName) g.placeName = e.place.name

    if (e.type === 'photo' && e.dailyKey) {
      if (dailySeen.has(e.dailyKey)) continue
      dailySeen.add(e.dailyKey)
      const photos = entries.filter((x) => x.type === 'photo' && x.dailyKey === e.dailyKey)
      // Mendoza a la izquierda, Hawái a la derecha
      photos.sort((a, b) => (a.city === b.city ? 0 : a.city === 'mendoza' ? -1 : 1))
      g.items.push({ kind: 'daily', key: e.dailyKey, photos })
    } else {
      g.items.push({ kind: 'entry', entry: e })
    }
  }
  return groups
}

function stamp(e: Entry) {
  const d = e.createdAt?.toDate() ?? new Date()
  return `${CITIES[e.city].label} · ${timeIn(d, CITIES[e.city].tz)}`
}

function DeleteButton({ entry, uid }: { entry: Entry; uid: string }) {
  if (entry.authorUid !== uid) return null
  return (
    <button
      className="link-btn"
      onClick={() => {
        if (confirm('¿Borrar esta entrada?')) removeEntry(entry)
      }}
    >
      borrar
    </button>
  )
}

function Meta({ entry, uid }: { entry: Entry; uid: string }) {
  return (
    <span className="meta">
      {stamp(entry)} <DeleteButton entry={entry} uid={uid} />
    </span>
  )
}

function EntryView({ entry, uid }: { entry: Entry; uid: string }) {
  const side = entry.city === 'hawaii' ? 'right' : 'left'

  switch (entry.type) {
    case 'message':
      return (
        <article className={`message ${side}`}>
          <p>{entry.text}</p>
          <Meta entry={entry} uid={uid} />
        </article>
      )
    case 'song': {
      const embed = entry.spotifyUrl ? spotifyEmbed(entry.spotifyUrl) : null
      return (
        <article className="song">
          {embed ? (
            <iframe
              title="Canción"
              src={embed.src}
              height={embed.height}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          ) : (
            <a href={entry.spotifyUrl} target="_blank" rel="noreferrer">
              {entry.spotifyUrl}
            </a>
          )}
          {entry.text && <p className="note">{entry.text}</p>}
          <Meta entry={entry} uid={uid} />
        </article>
      )
    }
    case 'place':
      return (
        <article className="place">
          <a
            className="place-map"
            href={`https://www.google.com/maps/search/?api=1&query=${entry.place!.lat},${entry.place!.lng}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver ${entry.place!.name} en el mapa`}
          >
            <MiniMap lat={entry.place!.lat} lng={entry.place!.lng} />
          </a>
          <div className="place-row">
            <span className="serif place-name">{entry.place!.name}</span>
            <Meta entry={entry} uid={uid} />
          </div>
          {entry.text && <p className="note">{entry.text}</p>}
        </article>
      )
    case 'photo':
      return (
        <article className="photo">
          <img src={entry.photoUrl} alt={entry.text || 'Foto'} loading="lazy" />
          {entry.text && <p className="note">{entry.text}</p>}
          <Meta entry={entry} uid={uid} />
        </article>
      )
  }
}

function DailyView({ photos, uid }: { photos: Entry[]; uid: string }) {
  return (
    <section className="daily">
      <span className="eyebrow">Foto del día</span>
      <div className="daily-grid">
        {photos.map((p) => (
          <figure key={p.id}>
            <img src={p.photoUrl} alt={`Foto del día desde ${CITIES[p.city].label}`} loading="lazy" />
            <figcaption>
              <Meta entry={p} uid={uid} />
            </figcaption>
          </figure>
        ))}
        {photos.length === 1 && (
          <figure className="daily-missing">
            <div>esperando…</div>
          </figure>
        )}
      </div>
    </section>
  )
}

export function Feed({ entries, uid }: { entries: Entry[]; uid: string }) {
  const groups = groupEntries(entries)

  if (groups.length === 0) {
    return (
      <div className="empty">
        <p className="serif">Todavía no hay nada.</p>
        <p className="muted">Tocá + y dejale lo primero.</p>
      </div>
    )
  }

  return (
    <div className="feed">
      {groups.map((g) => {
        const day = tripDay(g.key)
        const title = day >= 1 ? `Día ${day}` : prettyDate(g.key)
        return (
          <section key={g.key} className="day">
            <h2 className="day-title">
              {title}
              {g.placeName && <span className="muted italic"> · {g.placeName}</span>}
            </h2>
            {g.items.map((it) =>
              it.kind === 'daily' ? (
                <DailyView key={`d-${it.key}`} photos={it.photos} uid={uid} />
              ) : (
                <EntryView key={it.entry.id} entry={it.entry} uid={uid} />
              ),
            )}
          </section>
        )
      })}
    </div>
  )
}
