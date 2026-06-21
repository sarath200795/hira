import { hasPermission } from './roles/index.js'

/**
 * Decide whether a user may see/open an app tile.
 *
 * Default policy (plan): every APPROVED member sees every app, matching today's
 * behaviour. Tightening happens later via explicit `appAccess[appId]` toggles or
 * role/permission gates declared on the app module's `access` descriptor.
 */
export function canAccessApp(profile, mod) {
  if (!profile || profile.status !== 'approved') return false
  if (profile.isAdmin) return true

  // Explicit per-app grant/deny wins when present.
  const explicit = profile.appAccess?.[mod.id]
  if (explicit === true) return true
  if (explicit === false) return false

  const access = mod.access || {}
  // No constraints declared → open to all approved members (current behaviour).
  if (!access.roles && !access.perms) return true

  const roleOk = access.roles ? access.roles.includes(profile.role) : false
  const permOk = access.perms ? access.perms.some((p) => hasPermission(profile, p)) : false
  // If only one kind of constraint is declared, that one governs.
  if (access.roles && !access.perms) return roleOk
  if (access.perms && !access.roles) return permOk
  return roleOk || permOk
}
