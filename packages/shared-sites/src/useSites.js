import { useEffect, useMemo, useState } from 'react'
import { subscribeSites } from './sitesService.js'

/**
 * Live canonical sites for an org, plus derived helpers every adapter needs:
 *   - siteNames: string[]              (for name-based apps: hira, hecp-loto)
 *   - resolveSiteByName(name): site|null  (case-insensitive lookup)
 *   - byId(id): site|null
 */
export function useSites(orgId) {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) {
      setSites([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeSites(
      orgId,
      (list) => {
        setSites(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [orgId])

  return useMemo(() => {
    const activeSites = sites.filter((s) => s.active !== false)
    const nameIndex = new Map(sites.map((s) => [(s.name || '').trim().toLowerCase(), s]))
    const idIndex = new Map(sites.map((s) => [s.id, s]))
    return {
      sites,
      activeSites,
      siteNames: activeSites.map((s) => s.name),
      loading,
      resolveSiteByName: (name) => nameIndex.get((name || '').trim().toLowerCase()) || null,
      byId: (id) => idIndex.get(id) || null,
    }
  }, [sites, loading])
}
