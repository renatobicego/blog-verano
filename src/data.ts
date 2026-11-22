import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from './firebase'
import type { Daily, Entry, Profile } from './types'
import { compressImage } from './image'

export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  return user
}

export function useProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      doc(db, 'users', uid),
      (s) => setProfile(s.exists() ? (s.data() as Profile) : null),
      (e) => setError(e.code),
    )
  }, [uid])
  return { profile, error }
}

export async function saveProfile(uid: string, data: Pick<Profile, 'name' | 'city'>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export function useEntries(enabled: boolean) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  useEffect(() => {
    if (!enabled) return
    const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'), limit(1000))
    return onSnapshot(q, { includeMetadataChanges: false }, (s) =>
      setEntries(s.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Entry, 'id'>) }))),
    )
  }, [enabled])
  return entries
}

export function useDaily(key: string, enabled: boolean) {
  const [daily, setDaily] = useState<Daily | null>(null)
  useEffect(() => {
    if (!enabled) return
    return onSnapshot(doc(db, 'daily', key), (s) => setDaily(s.exists() ? (s.data() as Daily) : null))
  }, [key, enabled])
  return daily
}

type NewEntry = Omit<Entry, 'id' | 'createdAt' | 'authorUid' | 'authorName' | 'city'>

export async function postEntry(uid: string, profile: Profile, data: NewEntry) {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== ''))
  await addDoc(collection(db, 'entries'), {
    ...clean,
    authorUid: uid,
    authorName: profile.name,
    city: profile.city,
    createdAt: serverTimestamp(),
  })
}

export async function uploadPhoto(uid: string, file: File) {
  const blob = await compressImage(file)
  const path = `photos/${uid}/${Date.now()}.jpg`
  const r = ref(storage, path)
  await uploadBytes(r, blob, { contentType: 'image/jpeg' })
  return { photoUrl: await getDownloadURL(r), photoPath: path }
}

export async function removeEntry(entry: Entry) {
  await deleteDoc(doc(db, 'entries', entry.id))
  if (entry.photoPath) await deleteObject(ref(storage, entry.photoPath)).catch(() => {})
}

export async function sendPing(uid: string, profile: Profile) {
  await addDoc(collection(db, 'pings'), {
    fromUid: uid,
    fromName: profile.name,
    createdAt: serverTimestamp(),
  })
}

/** Último "pienso en vos" recibido, para mostrar un toast con la app abierta. */
export function useIncomingPings(uid: string | undefined, onPing: (fromName: string) => void) {
  useEffect(() => {
    if (!uid) return
    const startedAt = Date.now()
    const q = query(collection(db, 'pings'), orderBy('createdAt', 'desc'), limit(5))
    return onSnapshot(q, (s) => {
      s.docChanges().forEach((c) => {
        const d = c.doc.data({ serverTimestamps: 'estimate' })
        if (c.type === 'added' && d.fromUid !== uid && d.createdAt?.toMillis() > startedAt) onPing(d.fromName)
      })
    })
    // onPing se mantiene estable desde App
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])
}
