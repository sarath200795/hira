import {
  collection,
  onSnapshot,
  query,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore'
import {
  updateProfile as updateAuthProfile,
  updatePassword,
} from 'firebase/auth'
import { auth, db } from '@unified/shared-firebase'

const createdMs = (u) => {
  const c = u?.createdAt
  if (!c) return 0
  if (typeof c.toMillis === 'function') return c.toMillis()
  const t = new Date(c).getTime()
  return Number.isNaN(t) ? 0 : t
}

/**
 * Subscribe to all users within an organization (admin view).
 * Sorted client-side by creation time so the query needs no composite index.
 */
export function subscribeOrgUsers(orgId, callback) {
  const q = query(collection(db, 'users'), where('orgId', '==', orgId))
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    rows.sort((a, b) => createdMs(b) - createdMs(a))
    callback(rows)
  })
}

export function approveUser(uid) {
  return updateDoc(doc(db, 'users', uid), { status: 'approved' })
}

export function rejectUser(uid) {
  return updateDoc(doc(db, 'users', uid), { status: 'rejected' })
}

export function setUserRole(uid, role) {
  return updateDoc(doc(db, 'users', uid), { role })
}

export function updateOwnName(uid, name) {
  const tasks = [updateDoc(doc(db, 'users', uid), { name })]
  if (auth.currentUser) {
    tasks.push(updateAuthProfile(auth.currentUser, { displayName: name }))
  }
  return Promise.all(tasks)
}

export function changeOwnPassword(newPassword) {
  return updatePassword(auth.currentUser, newPassword)
}
