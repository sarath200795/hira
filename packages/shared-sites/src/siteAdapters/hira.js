import { useSites } from '../useSites.js'

/**
 * hira site adapter.
 *
 * hira historically stored sites as a `string[]` on the org doc and referenced
 * them by NAME in assessments (`assessment.siteName`). The adapter reads the
 * canonical subcollection instead and exposes `siteNames` so hira's existing
 * name-based UI works UNCHANGED, while `resolveSiteByName` bridges legacy
 * record references to canonical site docs.
 */
export function useHiraSites(orgId) {
  const { siteNames, activeSites, resolveSiteByName, loading } = useSites(orgId)
  return { sites: activeSites, siteNames, resolveSiteByName, loading }
}
