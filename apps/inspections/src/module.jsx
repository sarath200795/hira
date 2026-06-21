import { lazy, Suspense } from 'react'
import { Routes as RRRoutes, Route, Navigate } from 'react-router-dom'
import { FullScreenLoader } from '@unified/shared-ui'
import { DataProvider } from './context/DataContext.jsx'
import { actionsProvider as inspectionsActionsProvider } from './actions.js'
import './index.css'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Forms = lazy(() => import('./pages/Forms.jsx'))
const FormBuilder = lazy(() => import('./pages/FormBuilder.jsx'))
const Schedule = lazy(() => import('./pages/Schedule.jsx'))
const Overdue = lazy(() => import('./pages/Overdue.jsx'))
const Execute = lazy(() => import('./pages/Execute.jsx'))
const Records = lazy(() => import('./pages/Records.jsx'))
const AuditLog = lazy(() => import('./pages/AuditLog.jsx'))

/** Domain context provider (preserved). */
export const Provider = DataProvider

/** Sub-navigation shown by the engine shell when inspections is open. */
export const nav = [
  { to: 'dashboard', label: 'Dashboard' },
  { to: 'schedule', label: 'Schedule' },
  { to: 'overdue', label: 'Overdue' },
  { to: 'forms', label: 'Forms' },
  { to: 'execute', label: 'Execute' },
  { to: 'records', label: 'Records' },
  { to: 'audit', label: 'Audit Log' },
]

/** Inner router — RELATIVE paths, mounted by the engine at /apps/inspections/*. */
export function Routes() {
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <RRRoutes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="overdue" element={<Overdue />} />
        <Route path="forms" element={<Forms />} />
        <Route path="forms/new" element={<FormBuilder />} />
        <Route path="forms/:id/edit" element={<FormBuilder />} />
        <Route path="execute" element={<Execute />} />
        <Route path="records" element={<Records />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </RRRoutes>
    </Suspense>
  )
}

export const actionsProvider = inspectionsActionsProvider

export default { id: 'inspections', Provider, Routes, nav, actionsProvider }
