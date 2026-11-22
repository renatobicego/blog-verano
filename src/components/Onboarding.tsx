import { useState } from 'react'
import { CITIES, type City } from '../config'
import { saveProfile } from '../data'

export function Onboarding({ uid }: { uid: string }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState<City | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="screen centered">
      <h1 className="serif hero">Hola</h1>
      <div className="field">
        <label htmlFor="name" className="eyebrow">
          ¿Cómo te llamás?
        </label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <span className="eyebrow">¿Dónde vas a estar?</span>
        <div className="tabs two">
          {(Object.keys(CITIES) as City[]).map((c) => (
            <button key={c} className={city === c ? 'tab active' : 'tab'} aria-pressed={city === c} onClick={() => setCity(c)}>
              {CITIES[c].label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn primary full"
        disabled={!name.trim() || !city || busy}
        onClick={async () => {
          setBusy(true)
          await saveProfile(uid, { name: name.trim(), city: city! })
        }}
      >
        Listo
      </button>
    </div>
  )
}
