import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FullScreenLoader } from './ui'

/**
 * Guards the in-app area:
 *  - not signed in → /login
 *  - signed in but profile not yet loaded → loader (then dashboard)
 */
export default function ProtectedRoute({ children }) {
  const { loading, isAuthed } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader label="Securing your session…" />
  if (!isAuthed) return <Navigate to="/login" state={{ from: location }} replace />

  return children
}
