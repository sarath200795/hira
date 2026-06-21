import { lazy, Suspense } from 'react'
import { Routes as RRRoutes, Route, Navigate } from 'react-router-dom'
import { FullScreenLoader } from '@unified/shared-ui'
import { OrgDataProvider } from './context/OrgDataContext.jsx'
import { actionsProvider as auditActionsProvider } from './actions.js'
import './index.css'

const InternalAudit = lazy(() => import('./pages/app/InternalAudit.jsx'))
const FindingsRegister = lazy(() => import('./pages/app/FindingsRegister.jsx'))
const CapaRegister = lazy(() => import('./pages/app/CapaRegister.jsx'))
const Profile = lazy(() => import('./pages/app/Profile.jsx'))

/** Domain context provider (preserved). */
export const Provider = OrgDataProvider

/** Sub-navigation shown by the engine shell when internal-audit is open. */
export const nav = [
  { to: '', label: 'Audit Hub' },
  { to: 'findings', label: 'Findings' },
  { to: 'capa', label: 'CAPA' },
  { to: 'profile', label: 'Profile' },
]

/** Inner router — RELATIVE paths, mounted by the engine at /apps/internal-audit/*. */
export function Routes() {
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <RRRoutes>
        <Route index element={<InternalAudit />} />
        <Route path="findings" element={<FindingsRegister />} />
        <Route path="capa" element={<CapaRegister />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </RRRoutes>
    </Suspense>
  )
}

export const actionsProvider = auditActionsProvider

export default { id: 'internal-audit', Provider, Routes, nav, actionsProvider }
