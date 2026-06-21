import {
  ShieldAlert,
  Lock,
  Flame,
  Users,
  AlertTriangle,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// App registry — the single source of truth for the tiles dashboard, the shell
// app-switcher, and route mounting. Each entry is an AppModule DESCRIPTOR.
//
// `load` lazily imports the app's runtime module ({ Provider, Routes, nav,
// actionsProvider }) so app code is only fetched when its tile is opened
// (preserves per-app code-splitting). `placeholder: true` marks an app that is
// not yet ported — its tile shows "coming soon" and is not mountable.
// ─────────────────────────────────────────────────────────────────────────────

export const apps = [
  {
    id: 'hira',
    title: 'HIRA',
    description: 'Hazard Identification & Risk Assessment',
    icon: ShieldAlert,
    color: '#2563eb',
    basePath: '/apps/hira',
    access: { roles: ['admin', 'member'] },
    load: () => import('@unified/app-hira'),
  },
  {
    id: 'hecp-loto',
    title: 'HECP / LOTO',
    description: 'Hazardous Energy Control & Lockout-Tagout',
    icon: Lock,
    color: '#7c3aed',
    basePath: '/apps/hecp-loto',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
  },
  {
    id: 'fire-marshal',
    title: 'Fire Marshal',
    description: 'Fire extinguisher & mock-drill management',
    icon: Flame,
    color: '#dc2626',
    basePath: '/apps/fire-marshal',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
  },
  {
    id: 'hse-committee',
    title: 'HSE Committee',
    description: 'HSE committee & consultation meetings',
    icon: Users,
    color: '#0891b2',
    basePath: '/apps/hse-committee',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
  },
  {
    id: 'incident-ira',
    title: 'Incident IRA',
    description: 'Incident reporting & analysis',
    icon: AlertTriangle,
    color: '#ea580c',
    basePath: '/apps/incident-ira',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
  },
  {
    id: 'inspections',
    title: 'Inspections',
    description: 'Inspection forms & assignments',
    icon: ClipboardCheck,
    color: '#16a34a',
    basePath: '/apps/inspections',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
  },
  {
    id: 'internal-audit',
    title: 'Internal Audit',
    description: 'ISO 45001 audits, findings & CAPA',
    icon: FileSearch,
    color: '#4f46e5',
    basePath: '/apps/internal-audit',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Training & competency management',
    icon: GraduationCap,
    color: '#0d9488',
    basePath: '/apps/training',
    access: { roles: ['admin', 'member'] },
    placeholder: true,
    comingSoon: true,
  },
]

export const appsById = Object.fromEntries(apps.map((a) => [a.id, a]))

export function getApp(id) {
  return appsById[id] || null
}
