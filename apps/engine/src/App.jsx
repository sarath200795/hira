import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@unified/shared-auth'
import { FullScreenLoader } from '@unified/shared-ui'
import { isFirebaseConfigured } from '@unified/shared-firebase'
import EngineLayout from './shell/EngineLayout.jsx'
import SetupNeeded from './pages/SetupNeeded.jsx'

// Auth pages (engine owns these for ALL apps)
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const RegisterOrg = lazy(() => import('./pages/RegisterOrg.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const Pending = lazy(() => import('./pages/Pending.jsx'))
const Legal = lazy(() => import('./pages/Legal.jsx'))

// Shell pages
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const ActionTracker = lazy(() => import('./pages/ActionTracker.jsx'))
const AppMountPoint = lazy(() => import('./pages/AppMountPoint.jsx'))
const SitesAdmin = lazy(() => import('./admin/SitesAdmin.jsx'))
const UsersAdmin = lazy(() => import('./admin/UsersAdmin.jsx'))

export default function App() {
  if (!isFirebaseConfigured) return <SetupNeeded />
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <Routes>
        {/* Public auth routes — single login/signup/create-org for every app */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
        <Route path="/register-org" element={<PublicOnlyRoute><RegisterOrg /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/data-retention" element={<Legal kind="retention" />} />
        <Route path="/cookies" element={<Legal kind="cookies" />} />

        {/* Authenticated shell */}
        <Route element={<ProtectedRoute><EngineLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/action-tracker" element={<ActionTracker />} />
          <Route
            path="/admin/sites"
            element={<ProtectedRoute adminOnly><SitesAdmin /></ProtectedRoute>}
          />
          <Route
            path="/admin/users"
            element={<ProtectedRoute adminOnly><UsersAdmin /></ProtectedRoute>}
          />
          {/* Each app mounts its own sub-router under /apps/<id>/* */}
          <Route path="/apps/:appId/*" element={<AppMountPoint />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
