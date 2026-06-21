import { Navigate } from 'react-router-dom'
import { FullScreenLoader } from '@unified/shared-ui'
import { useAuth } from './AuthContext.jsx'

/** Auth pages (login/signup/register-org): if already signed in, go to dashboard. */
export default function PublicOnlyRoute({ children }) {
  const { loading, isAuthed } = useAuth()
  if (loading) return <FullScreenLoader label="Loading…" />
  if (isAuthed) return <Navigate to="/dashboard" replace />
  return children
}
