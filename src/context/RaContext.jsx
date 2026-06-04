import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { subscribeAssessments } from '../lib/firestore'
import { summarize } from '../lib/raStats'

const RaContext = createContext(null)

/** One real-time listener for the org's risk assessments; pages read slices. */
export function RaProvider({ children }) {
  const { orgId } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    const unsub = subscribeAssessments(orgId, (list) => {
      setAssessments(list)
      setLoading(false)
    })
    return unsub
  }, [orgId])

  const value = useMemo(() => ({
    loading,
    assessments,
    summary: summarize(assessments),
  }), [assessments, loading])

  return <RaContext.Provider value={value}>{children}</RaContext.Provider>
}

export function useRa() {
  const ctx = useContext(RaContext)
  if (!ctx) throw new Error('useRa must be used within RaProvider')
  return ctx
}
