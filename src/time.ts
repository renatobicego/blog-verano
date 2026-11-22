import { TRIP_END, TRIP_START } from './config'

/** YYYY-MM-DD de una fecha en una zona horaria */
export function dateKey(date: Date, tz: string): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  return p.format(date)
}

function keyToUtc(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const DAY = 86_400_000

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / DAY)
}

export const TOTAL_DAYS = daysBetween(TRIP_START, TRIP_END)

/** Número de día del viaje (1 = el día que se va). <= 0 antes de arrancar. */
export function tripDay(key: string): number {
  return daysBetween(TRIP_START, key) + 1
}

export function timeIn(date: Date, tz: string): string {
  return date.toLocaleTimeString('es-AR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
}

export function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
  })
}
