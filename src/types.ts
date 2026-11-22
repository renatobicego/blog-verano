import type { Timestamp } from 'firebase/firestore'
import type { City } from './config'

export type EntryType = 'message' | 'song' | 'place' | 'photo'

export interface Place {
  name: string
  lat: number
  lng: number
}

export interface Entry {
  id: string
  type: EntryType
  authorUid: string
  authorName: string
  city: City
  createdAt: Timestamp | null
  text?: string
  spotifyUrl?: string
  place?: Place
  photoUrl?: string
  photoPath?: string
  dailyKey?: string
}

export interface Profile {
  name: string
  city: City
  fcmTokens?: string[]
}

export interface Daily {
  scheduledAt?: Timestamp
  sentAt?: Timestamp
}
