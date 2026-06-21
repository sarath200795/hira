// Seeds the in-memory store with a demo org, users, sites, and per-app data so
// every ported app + the admin tabs + the Action Tracker show real content with
// NO Firebase backend. Idempotent (guarded).
import { store } from './store.js'

const ISO = (d) => d.toISOString().slice(0, 10)
const days = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const ts = (d = new Date()) => {
  const ms = d.getTime()
  return { __ts: true, seconds: Math.floor(ms / 1000), nanoseconds: 0, toDate: () => new Date(ms), toMillis: () => ms, valueOf: () => ms }
}

let seeded = false

export function seedDemoData() {
  if (seeded) return
  seeded = true

  const orgId = 'demo-org'
  const set = (path, data) => store.set(path, data)

  // ── Identity ───────────────────────────────────────────────────────────────
  set(`organizations/${orgId}`, {
    name: 'Demo Organization', nameLower: 'demo organization', address: '1 Demo Way, Demoville',
    createdBy: 'demo-admin', adminUid: 'demo-admin', createdAt: ts(days(-120)),
  })
  set('orgIndex/demo organization', { orgId, name: 'Demo Organization' })

  set('users/demo-admin', {
    name: 'Demo Admin', email: 'demo@unified.dev', orgId, orgName: 'Demo Organization',
    role: 'admin', roles: ['admin'], status: 'approved', appAccess: {}, appRoles: {}, permissions: [], createdAt: ts(days(-120)),
  })
  set('users/demo-member', {
    name: 'Sam Member', email: 'sam@unified.dev', orgId, orgName: 'Demo Organization',
    role: 'member', roles: ['member'], status: 'approved',
    appAccess: {}, appRoles: { 'internal-audit': 'member' }, permissions: [], createdAt: ts(days(-40)),
  })
  set('users/demo-pending', {
    name: 'Pat Pending', email: 'pat@unified.dev', orgId, orgName: 'Demo Organization',
    role: 'member', roles: ['member'], status: 'pending', appAccess: {}, appRoles: {}, permissions: [], createdAt: ts(days(-2)),
  })

  // ── Canonical sites (shared by every app) ────────────────────────────────────
  set(`organizations/${orgId}/sites/site-a`, { name: 'Plant A', code: 'PA', address: 'North Yard', location: 'North', active: true, createdAt: ts(days(-100)) })
  set(`organizations/${orgId}/sites/site-b`, { name: 'Plant B', code: 'PB', address: 'South Yard', location: 'South', active: true, createdAt: ts(days(-90)) })
  set(`organizations/${orgId}/sites/site-c`, { name: 'Warehouse C', code: 'WC', address: 'East Dock', location: 'East', active: true, createdAt: ts(days(-80)) })

  // ── hira: a risk assessment with an OPEN additional control ───────────────────
  set(`organizations/${orgId}/assessments/asmt-1`, {
    name: 'Working at Height — Roof Access', siteName: 'Plant A',
    members: [{ id: 'm1', name: 'Demo Admin' }, { id: 'm2', name: 'Sam Member' }],
    activities: [{
      id: 'act-1', title: 'Roof inspection',
      hazards: [{
        id: 'haz-1', description: 'Fall from height', whoMightBeHarmed: 'Inspector',
        probability: 4, severity: 5, projectedProbability: 2, projectedSeverity: 4,
        alarp: false, controls: [{ id: 'c0', hierarchy: 'Engineering', description: 'Guardrails' }],
        additionalControls: [
          { id: 'c1', hierarchy: 'Engineering', description: 'Install permanent edge protection', responsibleMemberId: 'm2', department: 'Maintenance', status: 'Open', dueDate: ISO(days(-5)) },
          { id: 'c2', hierarchy: 'Administrative', description: 'Issue work-at-height permits', responsibleMemberId: 'm1', department: 'HSE', status: 'In Progress', dueDate: ISO(days(7)) },
        ],
      }],
    }],
    createdBy: 'demo-admin', createdByName: 'Demo Admin', createdAt: ts(days(-30)), updatedAt: ts(days(-3)),
  })
  set(`organizations/${orgId}/activity/ev-1`, { type: 'event', message: 'created assessment "Working at Height"', actorUid: 'demo-admin', actorName: 'Demo Admin', at: ts(days(-30)) })

  // ── inspections: an active template + a record ────────────────────────────────
  set(`organizations/${orgId}/inspectionTemplates/tmpl-1`, {
    name: 'Monthly Fire Extinguisher Check', title: 'Monthly Fire Extinguisher Check', status: 'Active',
    frequency: 'Monthly', startDate: ISO(days(-90)), siteId: 'site-a', siteName: 'Plant A', area: 'Workshop',
    fields: [
      { id: 'f1', type: 'Pass/Fail', label: 'Extinguisher present & charged' },
      { id: 'f2', type: 'Text', label: 'Notes' },
    ],
    assignments: [], createdAt: ts(days(-90)),
  })
  set(`organizations/${orgId}/inspectionRecords/rec-1`, {
    templateId: 'tmpl-1', templateName: 'Monthly Fire Extinguisher Check', siteId: 'site-a', siteName: 'Plant A',
    status: 'Completed', result: 'PASS', scheduledFor: ISO(days(-30)), completedAt: days(-29).toISOString(), createdAt: ts(days(-29)),
  })

  // ── internal-audit: open findings + a CAPA ────────────────────────────────────
  set(`organizations/${orgId}/findings/find-1`, { title: 'Missing machine guard on press #3', description: 'Guard removed during maintenance, not refitted.', status: 'open', severity: 'major', siteId: 'site-a', dueDate: ISO(days(-3)), raisedAt: ts(days(-10)) })
  set(`organizations/${orgId}/findings/find-2`, { title: 'Expired first-aid supplies', description: 'Two kits past expiry.', status: 'in_progress', severity: 'minor', siteId: 'site-b', dueDate: ISO(days(10)), raisedAt: ts(days(-6)) })
  set(`organizations/${orgId}/capas/capa-1`, { title: 'Refit machine guard & add inspection step', action: 'Refit guard; add to weekly checklist', status: 'open', findingId: 'find-1', siteId: 'site-a', dueDate: ISO(days(2)), createdAt: ts(days(-9)) })
}

export default seedDemoData
