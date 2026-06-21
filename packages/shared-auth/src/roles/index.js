// Merged role + permission model (plan §"Unified User & Role Management").
//
// Hybrid model:
//   - engineRoles: coarse org-wide role for engine-level gating (admin/member).
//   - appRoleSpecs[appId]: each app's OWN domain roles, preserved verbatim, so a
//     user can be an "investigator" in incident-ira and a "technician" in
//     hecp-loto simultaneously. org-wide role 'admin' short-circuits to full
//     access everywhere (matches every app's current isAdmin semantics).

export const ENGINE_ROLES = ['admin', 'member']

/**
 * Per-app role catalogs. As each app is ported its spec is filled in. The
 * `default` is the role a plain approved member receives for that app unless an
 * admin overrides it via appRoles.
 */
export const appRoleSpecs = {
  hira: {
    roles: ['admin', 'member'],
    default: 'member',
    labels: { admin: 'Admin', member: 'Member' },
  },
  // Filled in as the remaining apps are ported:
  'incident-ira': {
    roles: ['reporter', 'investigator', 'admin'],
    default: 'reporter',
    labels: { reporter: 'Reporter', investigator: 'Investigator', admin: 'Admin' },
  },
  'hecp-loto': {
    roles: ['technician', 'engineering', 'safety', 'admin'],
    default: 'technician',
    labels: {
      technician: 'Technician',
      engineering: 'Engineering',
      safety: 'Safety',
      admin: 'Admin',
    },
  },
}

/** The effective per-app role for a user, honouring org-admin short-circuit. */
export function appRoleFor(profile, appId) {
  if (!profile) return null
  if (profile.isAdmin) return 'admin'
  const explicit = profile.appRoles?.[appId]
  if (explicit) return explicit
  return appRoleSpecs[appId]?.default || 'member'
}

/** hecp-loto-style permission check against the namespaced permissions[] array. */
export function hasPermission(profile, perm) {
  if (!profile) return false
  if (profile.isAdmin) return true
  return profile.permissions?.includes(perm)
}
