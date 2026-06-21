import { lazy, Suspense } from 'react'
import { Routes as RRRoutes, Route, Navigate } from 'react-router-dom'
import { FullScreenLoader } from '@unified/shared-ui'
import { RaProvider } from './context/RaContext.jsx'
import { actionsProvider as hiraActionsProvider } from './actions.js'
import './index.css'

// Route-level code splitting preserved from the original hira app.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const CreateAssessment = lazy(() => import('./pages/CreateAssessment.jsx'))
const Repository = lazy(() => import('./pages/Repository.jsx'))
const AssessmentView = lazy(() => import('./pages/AssessmentView.jsx'))
const BulkImport = lazy(() => import('./pages/BulkImport.jsx'))
const RiskRegister = lazy(() => import('./pages/RiskRegister.jsx'))
const ActionTracker = lazy(() => import('./pages/ActionTracker.jsx'))

/** Domain context provider (preserved). The engine wraps Routes in this. */
export const Provider = RaProvider

/** Sub-navigation shown by the engine shell when hira is open. */
export const nav = [
  { to: 'dashboard', label: 'Dashboard' },
  { to: 'repository', label: 'Assessments' },
  { to: 'create', label: 'New Assessment' },
  { to: 'risk-register', label: 'Risk Register' },
  { to: 'action-tracker', label: 'Actions' },
  { to: 'bulk-import', label: 'Bulk Import' },
]

/** hira's inner router — RELATIVE paths, mounted by the engine at /apps/hira/*. */
export function Routes() {
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <RRRoutes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create" element={<CreateAssessment />} />
        <Route path="create/:id" element={<CreateAssessment />} />
        <Route path="repository" element={<Repository />} />
        <Route path="assessment/:id" element={<AssessmentView />} />
        <Route path="risk-register" element={<RiskRegister />} />
        <Route path="action-tracker" element={<ActionTracker />} />
        <Route path="bulk-import" element={<BulkImport />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </RRRoutes>
    </Suspense>
  )
}

export const actionsProvider = hiraActionsProvider

export default { id: 'hira', Provider, Routes, nav, actionsProvider }
