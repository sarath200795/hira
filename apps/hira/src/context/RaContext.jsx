import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@unified/shared-auth'
import { useHiraSites } from '@unified/shared-sites'
import { subscribeAssessments, subscribeOrg, subscribeActivity } from '../lib/firestore'
import { summarize } from '../lib/raStats'

const RaContext = createContext(null)

/** One real-time listener for the org's risk assessments + org doc; pages read slices. */
export function RaProvider({ children }) {
  const { orgId } = useAuth()
  // Sites now come from the unified, engine-managed subcollection (the hira
  // adapter exposes them as a name[] so hira's existing site-by-name UI is
  // unchanged), instead of the legacy `org.sites` string[] on the org doc.
  const { siteNames } = useHiraSites(orgId)
  const [assessments, setAssessments] = useState([])
  const [org, setOrg] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    // If a listener is denied/fails, stop loading so the UI shows an empty state
    // (with a one-time toast) instead of a perpetual spinner or blank screen.
    let warned = false
    const onErr = (err) => {
      setLoading(false)
      if (!warned) {
        warned = true
        toast.error(
          err?.code === 'permission-denied'
            ? "You don't have access to this organization's data."
            : 'Could not load live data. Check your connection.'
        )
      }
    }
    const u1 = subscribeAssessments(orgId, (list) => {
      setAssessments(list)
      setLoading(false)
    }, onErr)
    const u2 = subscribeOrg(orgId, setOrg, onErr)
    const u3 = subscribeActivity(orgId, setActivity, onErr)
    return () => { u1(); u2(); u3() }
  }, [orgId])

  const value = useMemo(() => ({
    loading,
    assessments,
    org,
    sites: siteNames,
    activity,
    summary: summarize(assessments),
  }), [assessments, org, activity, loading, siteNames])

  return <RaContext.Provider value={value}>{children}</RaContext.Provider>
}

export function useRa() {
  const ctx = useContext(RaContext)
  if (!ctx) throw new Error('useRa must be used within RaProvider')
  return ctx
}
