import { connectAuthEmulator as __connectAuthEmu } from 'firebase/auth'
import { connectFirestoreEmulator as __connectFsEmu } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Helpful warning if the developer forgot to create .env
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[HIRA] Firebase is not configured. Copy .env.example to .env and add your project keys.'
  )
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Session persistence: the login is dropped when the tab/browser is closed.
if (isFirebaseConfigured) {
  setPersistence(auth, browserSessionPersistence).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[HIRA] could not set session persistence:', e?.message || e)
  })
}

export default app

// ── Local emulator wiring (demo / offline dev only) ──────────────────────────
// When VITE_USE_EMULATOR is "1", point Auth + Firestore at the local Firebase
// emulators. Guarded by an env flag absent in production builds.
export const usingEmulator = import.meta.env.VITE_USE_EMULATOR === '1'
if (usingEmulator && auth && db) {
  __connectAuthEmu(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  __connectFsEmu(db, '127.0.0.1', 8080)
}
