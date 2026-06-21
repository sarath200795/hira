// Canonical, unified site model (plan §"Unified Site Management"):
//   organizations/{orgId}/sites/{siteId}
//     { name, code, address, location, active, createdAt, createdBy }
//
// One subcollection per org — matches inspections/internal-audit/hse already and
// needs no orgId filter. Apps that historically modelled sites differently
// (hecp top-level, hira string[], free-text) consume this via per-app adapters.
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@unified/shared-firebase'

const sitesCol = (orgId) => collection(db, 'organizations', orgId, 'sites')
const siteRef = (orgId, id) => doc(db, 'organizations', orgId, 'sites', id)

export function subscribeSites(orgId, cb, onError) {
  if (!orgId) return () => {}
  const q = query(sitesCol(orgId), orderBy('name'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError || (() => {})
  )
}

export async function addSite(orgId, { name, code = '', address = '', location = '' }, actor) {
  const ref = await addDoc(sitesCol(orgId), {
    name: (name || '').trim(),
    code: code.trim(),
    address: address.trim(),
    location: location.trim(),
    active: true,
    createdBy: actor?.uid || null,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSite(orgId, id, patch) {
  await updateDoc(siteRef(orgId, id), patch)
}

export async function deleteSite(orgId, id) {
  await deleteDoc(siteRef(orgId, id))
}
