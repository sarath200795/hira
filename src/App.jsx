import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { RaProvider } from './context/RaContext'
import { FullScreenLoader } from './components/ui'
import { isFirebaseConfigured } from './firebase'
import SetupNeeded from './pages/SetupNeeded'

// Route-level code splitting — each page is fetched only when navigated to.
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const RegisterOrg = lazy(() => import('./pages/RegisterOrg'))
const Legal = lazy(() => import('./pages/Legal'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateAssessment = lazy(() => import('./pages/CreateAssessment'))
const Repository = lazy(() => import('./pages/Repository'))
const AssessmentView = lazy(() => import('./pages/AssessmentView'))
const BulkImport = lazy(() => import('./pages/BulkImport'))
const RiskRegister = lazy(() => import('./pages/RiskRegister'))
const ActionTracker = lazy(() => import('./pages/ActionTracker'))
const Organization = lazy(() => import('./pages/Organization'))

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
  if (!isFirebaseConfigured) return <SetupNeeded />
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-org" element={<RegisterOrg />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/data-retention" element={<Legal kind="retention" />} />
        <Route path="/cookies" element={<Legal kind="cookies" />} />

        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create" element={<CreateAssessment />} />
          <Route path="create/:id" element={<CreateAssessment />} />
          <Route path="repository" element={<Repository />} />
          <Route path="assessment/:id" element={<AssessmentView />} />
          <Route path="risk-register" element={<RiskRegister />} />
          <Route path="action-tracker" element={<ActionTracker />} />
          <Route path="organization" element={<Organization />} />
          <Route path="bulk-import" element={<BulkImport />} />
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
