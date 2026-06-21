import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@unified/shared-firebase'

const col = (orgId) => collection(db, 'organizations', orgId, 'sites')

export function subscribeSites(orgId, callback) {
  const q = query(col(orgId), orderBy('name'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function createSite(orgId, data) {
  return addDoc(col(orgId), { ...data, createdAt: serverTimestamp() })
}

export function updateSite(orgId, siteId, data) {
  return updateDoc(doc(db, 'organizations', orgId, 'sites', siteId), data)
}

export function deleteSite(orgId, siteId) {
  return deleteDoc(doc(db, 'organizations', orgId, 'sites', siteId))
}
