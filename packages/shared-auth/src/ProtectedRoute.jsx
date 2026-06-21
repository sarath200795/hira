import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { FullScreenLoader } from '@unified/shared-ui'
import { useAuth } from './AuthContext.jsx'
import { canAccessApp } from './accessModel.js'

/**
 * Single guard for the whole engine. Props:
 *   - adminOnly: require org-admin (bounce members to /dashboard)
 *   - access:    an app-module access descriptor → require canAccessApp
 *
 * Carries over the hardening decisions from the source apps: memoise the
 * redirect `state` (avoid the fire-marshal navigation-storm bug) and do NOT
 * gate cross-page transitions behind AnimatePresence.
 */
export default function ProtectedRoute({ children, adminOnly = false, access = null }) {
  const { loading, isAuthed, isApproved, isAdmin, profile } = useAuth()
  const location = useLocation()
  const fromState = useMemo(() => ({ from: location }), [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <FullScreenLoader label="Securing your session…" />
  if (!isAuthed) return <Navigate to="/login" state={fromState} replace />
  if (!isApproved) return <Navigate to="/pending" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  if (access && !canAccessApp(profile, { id: access.id, access })) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
