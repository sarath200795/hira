// Mock for the subset of `firebase/auth` the apps use. Auto-signs-in a demo
// admin whose profile is seeded at users/demo-admin.
import { genId } from './store.js'

export const DEMO_USER = { uid: 'demo-admin', email: 'demo@unified.dev', displayName: 'Demo Admin' }

let currentUser = DEMO_USER
const observers = new Set()
const notifyAuth = () => observers.forEach((o) => { try { o(currentUser) } catch {} })

export function getAuth() {
  return { get currentUser() { return currentUser } }
}

export function onAuthStateChanged(_auth, cb) {
  const fn = typeof cb === 'function' ? cb : cb?.next
  observers.add(fn)
  Promise.resolve().then(() => fn(currentUser))
  return () => observers.delete(fn)
}

export function signInWithEmailAndPassword(_auth, email) {
  currentUser = { ...DEMO_USER, email: email || DEMO_USER.email }
  notifyAuth()
  return Promise.resolve({ user: currentUser })
}

export function createUserWithEmailAndPassword(_auth, email) {
  currentUser = { uid: 'user_' + genId(), email, displayName: '' }
  notifyAuth()
  return Promise.resolve({ user: currentUser })
}

export function signOut() {
  currentUser = null
  notifyAuth()
  return Promise.resolve()
}

export function updateProfile(user, profile) {
  if (user) Object.assign(user, profile)
  return Promise.resolve()
}

export function deleteUser() {
  currentUser = null
  notifyAuth()
  return Promise.resolve()
}

export function sendPasswordResetEmail() { return Promise.resolve() }
export function updatePassword() { return Promise.resolve() }
export function updateEmail() { return Promise.resolve() }
export function verifyBeforeUpdateEmail() { return Promise.resolve() }
export function reauthenticateWithCredential() { return Promise.resolve({ user: currentUser }) }
export function EmailAuthProvider() {}
EmailAuthProvider.credential = () => ({})
export function setPersistence() { return Promise.resolve() }
export const browserSessionPersistence = 'session'
export const browserLocalPersistence = 'local'
export const inMemoryPersistence = 'memory'
export function GoogleAuthProvider() {}
GoogleAuthProvider.credential = () => ({})
export function signInWithPopup() { return Promise.resolve({ user: currentUser }) }
export function onIdTokenChanged(_auth, cb) { return onAuthStateChanged(_auth, cb) }

export default { getAuth }
