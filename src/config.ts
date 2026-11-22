// Fechas del viaje (YYYY-MM-DD). Los días se cuentan en hora de Hawái.
export const TRIP_START = '2026-11-26' // se va ella
export const TRIP_END = '2027-03-15' // vas vos

export const CITIES = {
  mendoza: { label: 'Mendoza', tz: 'America/Argentina/Mendoza' },
  hawaii: { label: 'Hawái', tz: 'Pacific/Honolulu' },
} as const

export type City = keyof typeof CITIES

// Zona horaria con la que se agrupa el feed por día
export const FEED_TZ = CITIES.hawaii.tz
// Zona horaria con la que se define el "día" de la foto del día (debe coincidir con functions)
export const DAILY_TZ = CITIES.mendoza.tz
