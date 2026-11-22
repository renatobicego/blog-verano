import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger, setGlobalOptions } from 'firebase-functions/v2'

initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 2 })

const db = getFirestore()

// ── Foto del día ───────────────────────────────────────────────
// Hora de Mendoza en la que puede saltar la notificación (Hawái = Mendoza − 7 h).
// 15 a 22 h en Mendoza = 8 a 15 h en Hawái.
const DAILY_TZ = 'America/Argentina/Mendoza'
const DAILY_FROM_HOUR = 15
const DAILY_TO_HOUR = 22
const MENDOZA_UTC_OFFSET = -3 // Mendoza no tiene horario de verano

const CITY_LABEL: Record<string, string> = { mendoza: 'Mendoza', hawaii: 'Hawái' }

function dateKey(date: Date, tz: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** Manda una notificación a todos los dispositivos de todos los usuarios menos `exceptUid`. */
async function notify(exceptUid: string | null, title: string, body: string) {
  const users = await db.collection('users').get()
  const targets: { uid: string; token: string }[] = []
  users.forEach((u) => {
    if (u.id === exceptUid) return
    for (const token of (u.get('fcmTokens') as string[] | undefined) ?? []) targets.push({ uid: u.id, token })
  })
  if (targets.length === 0) return

  const res = await getMessaging().sendEachForMulticast({
    tokens: targets.map((t) => t.token),
    notification: { title, body },
    webpush: {
      notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
      headers: { Urgency: 'high' },
    },
  })

  // Limpia tokens viejos
  const dead = res.responses
    .map((r, i) => ({ r, t: targets[i] }))
    .filter(
      ({ r }) =>
        !r.success &&
        ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code ?? ''),
    )
  await Promise.all(
    dead.map(({ t }) => db.doc(`users/${t.uid}`).update({ fcmTokens: FieldValue.arrayRemove(t.token) })),
  )
  logger.info(`Notificación "${title}": ${res.successCount} ok, ${res.failureCount} fallidas`)
}

export const onEntryCreated = onDocumentCreated('entries/{id}', async (event) => {
  const e = event.data?.data()
  if (!e) return
  const from = `${e.authorName} · ${CITY_LABEL[e.city] ?? ''}`
  let body: string
  switch (e.type) {
    case 'message':
      body = String(e.text ?? '').slice(0, 120)
      break
    case 'song':
      body = 'Te dejó una canción'
      break
    case 'place':
      body = `Está en ${e.place?.name ?? 'un lugar nuevo'}`
      break
    case 'photo':
      body = e.dailyKey ? 'Subió la foto del día' : 'Subió una foto'
      break
    default:
      body = 'Nueva entrada'
  }
  await notify(e.authorUid, from, body)
})

export const onPingCreated = onDocumentCreated('pings/{id}', async (event) => {
  const p = event.data?.data()
  if (!p) return
  await notify(p.fromUid, p.fromName, 'Está pensando en vos')
})

/**
 * Cada 10 minutos: si hoy todavía no hay hora sorteada, la sortea dentro de la ventana.
 * Cuando llega esa hora, avisa a los dos al mismo tiempo.
 */
export const dailyPhoto = onSchedule({ schedule: 'every 10 minutes', timeZone: DAILY_TZ }, async () => {
  const now = new Date()
  const key = dateKey(now, DAILY_TZ)
  const ref = db.doc(`daily/${key}`)

  const shouldSend = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      const [y, m, d] = key.split('-').map(Number)
      const minutes = DAILY_FROM_HOUR * 60 + Math.floor(Math.random() * (DAILY_TO_HOUR - DAILY_FROM_HOUR) * 60)
      const utc = Date.UTC(y, m - 1, d, 0, minutes) - MENDOZA_UTC_OFFSET * 3_600_000
      tx.set(ref, { scheduledAt: Timestamp.fromMillis(utc) })
      logger.info(`Foto del día ${key} sorteada para ${new Date(utc).toISOString()}`)
      return false
    }
    const data = snap.data()!
    if (data.sentAt || data.scheduledAt.toMillis() > now.getTime()) return false
    tx.update(ref, { sentAt: FieldValue.serverTimestamp() })
    return true
  })

  if (shouldSend) await notify(null, 'Foto del día', 'Ahora. Sacá una foto de lo que estás haciendo.')
})
