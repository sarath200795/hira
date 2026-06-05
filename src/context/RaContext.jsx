import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { subscribeAssessments, subscribeOrg } from '../lib/firestore'
import { summarize } from '../lib/raStats'

const RaContext = createContext(null)

/** One real-time listener for the org's risk assessments + org doc; pages read slices. */
export function RaProvider({ children }) {
  const { orgId } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    const u1 = subscribeAssessments(orgId, (list) => {
      setAssessments(list)
      setLoading(false)
    })
    const u2 = subscribeOrg(orgId, setOrg)
    return () => { u1(); u2() }
  }, [orgId])

  const value = useMemo(() => ({
    loading,
    assessments,
    org,
    sites: org?.sites || [],
    summary: summarize(assessments),
  }), [assessments, org, loading])

  return <RaContext.Provider value={value}>{children}</RaContext.Provider>
}

export function useRa() {
  const ctx = useContext(RaContext)
  if (!ctx) throw new Error('useRa must be used within RaProvider')
  return ctx
}
