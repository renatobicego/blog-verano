import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { app, db } from './firebase'

export async function pushSupported(): Promise<boolean> {
  return 'Notification' in window && 'serviceWorker' in navigator && (await isSupported())
}

/** Pide permiso (tiene que llamarse desde un click) y guarda el token del dispositivo. */
export async function enableNotifications(uid: string): Promise<boolean> {
  if (!(await pushSupported())) return false
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false
  await registerToken(uid)
  return true
}

/** Si ya hay permiso, refresca el token en cada arranque. */
export async function registerToken(uid: string): Promise<void> {
  if (!(await pushSupported()) || Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.ready
  const token = await getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
  if (token) await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) })
}

/** Notificaciones con la app abierta: las mostramos como toast. */
export async function listenForeground(cb: (title: string, body: string) => void): Promise<() => void> {
  if (!(await pushSupported())) return () => {}
  return onMessage(getMessaging(app), (p) => cb(p.notification?.title ?? '', p.notification?.body ?? ''))
}
