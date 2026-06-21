// ─────────────────────────────────────────────────────────────────────────────
// Shared identity data layer — the ONE place all apps read/write the unified
// engine's identity collections:
//   organizations/{orgId}            — org doc { name, nameLower, address, createdBy, createdAt }
//   users/{uid}                      — superset profile (see plan §"Unified auth")
//   orgIndex/{slug}                  — public name→org index used by signup dropdown
//
// This consolidates the near-identical createOrganization / createMember /
// findOrgByName / getUserProfile helpers that every app had its own copy of.
// ─────────────────────────────────────────────────────────────────────────────
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@unified/shared-firebase'

const orgRef = (orgId) => doc(db, 'organizations', orgId)
const userRef = (uid) => doc(db, 'users', uid)
const orgIndexKey = (name) => (name || '').trim().toLowerCase()
const orgIndexRef = (name) => doc(db, 'orgIndex', orgIndexKey(name))

/**
 * Multi-role / superset normaliser. Ensures `roles[]` exists and `role`/`isAdmin`
 * stay consistent so every app's existing `role === 'admin'` checks keep working.
 * Also surfaces the per-app maps (`appRoles`, `appAccess`, `permissions`).
 */
export function normalizeProfile(p) {
  if (!p) return null
  const roles = Array.isArray(p.roles) && p.roles.length ? p.roles : p.role ? [p.role] : []
  const isAdmin = p.isAdmin === true || roles.includes('admin') || p.role === 'admin'
  const role = isAdmin ? 'admin' : roles.includes(p.role) ? p.role : roles[0] || p.role || 'member'
  return {
    ...p,
    roles,
    isAdmin,
    role,
    status: p.status || 'pending',
    appRoles: p.appRoles || {},
    appAccess: p.appAccess || {},
    permissions: Array.isArray(p.permissions) ? p.permissions : [],
  }
}

// ── Organizations ─────────────────────────────────────────────────────────────

/** Create an org + its first admin user + public name index, atomically. */
export async function createOrganization({ orgName, address, uid, name, email }) {
  const org = doc(collection(db, 'organizations'))
  const batch = writeBatch(db)
  batch.set(org, {
    name: orgName,
    nameLower: orgName.trim().toLowerCase(),
    address: address || '',
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  batch.set(userRef(uid), {
    name,
    email,
    orgId: org.id,
    orgName,
    role: 'admin',
    roles: ['admin'],
    status: 'approved',
    appAccess: {},
    appRoles: {},
    permissions: [],
    createdAt: serverTimestamp(),
  })
  batch.set(orgIndexRef(orgName), { orgId: org.id, name: orgName })
  await batch.commit()
  return org.id
}

export async function findOrgByName(orgName) {
  const snap = await getDoc(orgIndexRef(orgName))
  if (!snap.exists()) return null
  const d = snap.data()
  return { id: d.orgId, name: d.name }
}

/** Every organization from the public orgIndex, [{ id, name }] sorted by name. */
export async function listOrganizations() {
  const snap = await getDocs(collection(db, 'orgIndex'))
  return snap.docs
    .map((d) => ({ id: d.data().orgId, name: d.data().name }))
    .filter((o) => o.id && o.name)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function subscribeOrg(orgId, cb, onError) {
  return onSnapshot(
    orgRef(orgId),
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError || (() => {})
  )
}

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * Create a member joining an existing org. `autoApprove` mirrors hira's
 * historical behaviour (auto-approved); other apps used a pending queue, so the
 * engine defaults to pending and lets the signup flow opt into auto-approve.
 */
export async function createMember({ uid, name, email, orgId, orgName }, { autoApprove = false } = {}) {
  await setDoc(userRef(uid), {
    name,
    email,
    orgId,
    orgName: orgName || '',
    role: 'member',
    roles: ['member'],
    status: autoApprove ? 'approved' : 'pending',
    appAccess: {},
    appRoles: {},
    permissions: [],
    createdAt: serverTimestamp(),
  })
}

export async function getUserProfile(uid) {
  const snap = await getDoc(userRef(uid))
  return snap.exists() ? normalizeProfile({ uid, ...snap.data() }) : null
}

export function subscribeOrgUsers(orgId, cb, onError) {
  const q = query(collection(db, 'users'), where('orgId', '==', orgId))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => normalizeProfile({ uid: d.id, ...d.data() }))),
    onError || (() => {})
  )
}

// ── Admin mutations (used by the unified Users & Role Management screen) ────────

export async function setUserStatus(uid, status) {
  await updateDoc(userRef(uid), { status })
}

export async function setUserRole(uid, role) {
  await updateDoc(userRef(uid), { role, roles: role === 'admin' ? ['admin'] : [role] })
}

/** Set a per-app domain role (e.g. incident-ira "investigator"). */
export async function setAppRole(uid, appId, appRole) {
  await updateDoc(userRef(uid), { [`appRoles.${appId}`]: appRole })
}

/** Explicitly grant/revoke access to one app tile. */
export async function setAppAccess(uid, appId, enabled) {
  await updateDoc(userRef(uid), { [`appAccess.${appId}`]: !!enabled })
}
