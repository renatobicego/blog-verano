import { CITIES, FEED_TZ, TRIP_END } from '../config'
import { daysBetween, dateKey, timeIn, TOTAL_DAYS, tripDay } from '../time'
import { useNow } from '../useNow'

export function Header() {
  const now = useNow()
  const today = dateKey(now, FEED_TZ)
  const day = tripDay(today)
  const left = daysBetween(today, TRIP_END)
  const progress = Math.min(1, Math.max(0, (day - 1) / TOTAL_DAYS))

  let dayLabel: string
  let leftLabel: string
  if (day < 1) {
    dayLabel = `Arranca en ${1 - day} ${1 - day === 1 ? 'día' : 'días'}`
    leftLabel = `${TOTAL_DAYS} días hasta el 15 de marzo`
  } else if (left > 0) {
    dayLabel = `Día ${day} de ${TOTAL_DAYS}`
    leftLabel = `faltan ${left} ${left === 1 ? 'día' : 'días'} para el 15 de marzo`
  } else {
    dayLabel = left === 0 ? 'Hoy' : 'Juntos'
    leftLabel = left === 0 ? 'hoy viajás' : ''
  }

  return (
    <header className="header">
      <div className="clocks">
        <div className="clock">
          <span className="eyebrow">{CITIES.mendoza.label}</span>
          <span className="clock-time">{timeIn(now, CITIES.mendoza.tz)}</span>
        </div>
        <span className="muted small clock-diff">−7 h</span>
        <div className="clock right">
          <span className="eyebrow">{CITIES.hawaii.label}</span>
          <span className="clock-time accent">{timeIn(now, CITIES.hawaii.tz)}</span>
        </div>
      </div>
      <div className="progress-row">
        <span>{dayLabel}</span>
        <span className="muted">{leftLabel}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${progress * 100}%` }} />
      </div>
    </header>
  )
}
