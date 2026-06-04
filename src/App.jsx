import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { RaProvider } from './context/RaContext'
import { FullScreenLoader } from './components/ui'
import { isFirebaseConfigured } from './firebase'
import SetupNeeded from './pages/SetupNeeded'

// Route-level code splitting — each page is fetched only when navigated to.
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const RegisterOrg = lazy(() => import('./pages/RegisterOrg'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateAssessment = lazy(() => import('./pages/CreateAssessment'))
const Repository = lazy(() => import('./pages/Repository'))
const AssessmentView = lazy(() => import('./pages/AssessmentView'))
const BulkImport = lazy(() => import('./pages/BulkImport'))
const RiskRegister = lazy(() => import('./pages/RiskRegister'))
const ActionTracker = lazy(() => import('./pages/ActionTracker'))

function AppShell() {
  return (
    <ProtectedRoute>
      <RaProvider>
        <Layout />
      </RaProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  const location = useLocation()
  if (!isFirebaseConfigured) return <SetupNeeded />
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register-org" element={<RegisterOrg />} />

          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreateAssessment />} />
            <Route path="create/:id" element={<CreateAssessment />} />
            <Route path="repository" element={<Repository />} />
            <Route path="assessment/:id" element={<AssessmentView />} />
            <Route path="risk-register" element={<RiskRegister />} />
            <Route path="action-tracker" element={<ActionTracker />} />
            <Route path="bulk-import" element={<BulkImport />} />
          </Route>

          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
