import { useCallback, useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { DAILY_TZ } from './config'
import { sendPing, useAuthUser, useDaily, useEntries, useIncomingPings, useProfile } from './data'
import { enableNotifications, listenForeground, pushSupported, registerToken } from './notifications'
import { dateKey } from './time'
import { useNow } from './useNow'
import { Header } from './components/Header'
import { Feed } from './components/Feed'
import { Composer } from './components/Composer'
import { MapView } from './components/MapView'
import { Login } from './components/Login'
import { Onboarding } from './components/Onboarding'
import { FeedIcon, HeartIcon, MapIcon, PlusIcon } from './components/Icons'

type View = 'feed' | 'map' | 'new' | 'daily'

export default function App() {
  const user = useAuthUser()
  const { profile, error } = useProfile(user?.uid)
  const ready = !!user && !!profile
  const entries = useEntries(ready)
  const now = useNow(60_000)
  const todayDaily = dateKey(now, DAILY_TZ)
  const daily = useDaily(todayDaily, ready)

  const [view, setView] = useState<View>('feed')
  const [toast, setToast] = useState<string | null>(null)
  const [pinged, setPinged] = useState(false)
  const [canNotify, setCanNotify] = useState(false)
  const [notifOn, setNotifOn] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    pushSupported().then(setCanNotify)
  }, [])

  useEffect(() => {
    if (!ready) return
    registerToken(user!.uid).catch(() => {})
    let off = () => {}
    listenForeground((title, body) => showToast(body || title)).then((f) => (off = f))
    return () => off()
  }, [ready, user, showToast])

  useIncomingPings(ready ? user!.uid : undefined, (from) => showToast(`${from} está pensando en vos`))

  if (user === undefined || (user && profile === undefined && !error)) return <div className="screen" />
  if (!user) return <Login />
  if (error === 'permission-denied')
    return (
      <div className="screen centered">
        <p className="serif hero">Esta cuenta no tiene acceso.</p>
        <button className="btn secondary" onClick={() => signOut(auth)}>
          Salir
        </button>
      </div>
    )
  if (!profile) return <Onboarding uid={user.uid} />

  if (view === 'new' || view === 'daily')
    return (
      <Composer
        uid={user.uid}
        profile={profile}
        dailyKey={view === 'daily' ? todayDaily : undefined}
        onDone={() => setView('feed')}
      />
    )

  const dailyPending =
    !!daily?.sentAt && !!entries && !entries.some((e) => e.dailyKey === todayDaily && e.authorUid === user.uid)

  async function ping() {
    setPinged(true)
    setTimeout(() => setPinged(false), 1800)
    await sendPing(user!.uid, profile!).catch(() => showToast('No se pudo enviar'))
  }

  return (
    <div className="app">
      <Header />

      <main className="main">
        {canNotify && !notifOn && (
          <button
            className="banner"
            onClick={async () => setNotifOn(await enableNotifications(user.uid).catch(() => false))}
          >
            Activá las notificaciones para enterarte cuando te deje algo
          </button>
        )}
        {dailyPending && (
          <button className="banner accent" onClick={() => setView('daily')}>
            <strong>Foto del día</strong> · sacala ahora
          </button>
        )}

        {view === 'feed' && (entries ? <Feed entries={entries} uid={user.uid} /> : null)}
        {view === 'map' && (entries ? <MapView entries={entries} /> : null)}

        <button className="link-btn signout" onClick={() => signOut(auth)}>
          Cerrar sesión
        </button>
      </main>

      {view === 'feed' && (
        <button className={pinged ? 'fab sent' : 'fab'} onClick={ping}>
          <HeartIcon />
          {pinged ? 'Enviado' : 'Pienso en vos'}
        </button>
      )}

      <nav className="tabbar">
        <button className={view === 'feed' ? 'tabbar-item active' : 'tabbar-item'} onClick={() => setView('feed')}>
          <FeedIcon />
          Feed
        </button>
        <button className="tabbar-plus" aria-label="Nueva entrada" onClick={() => setView('new')}>
          <PlusIcon />
        </button>
        <button className={view === 'map' ? 'tabbar-item active' : 'tabbar-item'} onClick={() => setView('map')}>
          <MapIcon />
          Mapa
        </button>
      </nav>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
