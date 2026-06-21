import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { seedDemoData } from '@unified/demo-firebase'

/**
 * Single Firebase init for the whole unified engine (ONE shared project).
 *
 * Ported from hecp-loto's defensive config: env values are sanitised to strip
 * BOM / zero-width / whitespace characters that frequently sneak into copied
 * dashboard values and silently break auth. Supports an optional named
 * Firestore database id.
 */
function cleanEnv(v) {
  if (v == null) return ''
  return String(v)
    .replace(/^﻿/, '') // BOM
    .replace(/[​-‍⁠]/g, '') // zero-width chars
    .trim()
}

const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID),
}

const dbId = cleanEnv(import.meta.env.VITE_FIREBASE_DB_ID)

// Demo mode: firebase/* imports are aliased to in-memory mocks (see the engine's
// vite.config.js). Treat as "configured" so the app skips the SetupNeeded gate,
// and seed the in-memory store once.
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
// Seed synchronously so the demo profile exists before auth state resolves.
if (isDemoMode) seedDemoData()

export const isFirebaseConfigured = isDemoMode || Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

if (!isFirebaseConfigured && typeof console !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn(
    '[unified-engine] Firebase is not configured. Copy .env.example to apps/engine/.env and add your project keys.'
  )
}

// Guard against double-init under HMR / multiple imports.
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null

export const auth = app ? getAuth(app) : null

export const db = app
  ? (dbId
      ? initializeFirestore(app, {}, dbId)
      : getFirestore(app))
  : null

export const storage = app ? getStorage(app) : null

if (auth && isFirebaseConfigured) {
  setPersistence(auth, browserSessionPersistence).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[unified-engine] could not set session persistence:', e?.message || e)
  })
}

export default app
