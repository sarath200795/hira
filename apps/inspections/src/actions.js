import { subscribeTemplates, subscribeRecords } from './lib/firestore'
import { buildScheduledTasks, formatDateOnly, normalizeTemplateFields } from './lib/schedule'

/**
 * inspections actionsProvider — feeds the engine's cumulative Action Tracker.
 *
 * Surfaces overdue and due-today scheduled inspection tasks (the same notion the
 * app's Overdue page shows) as normalized ActionItems. Re-emits whenever
 * templates or records change.
 *
 * Signature: (orgId, profile, cb) => unsubscribe
 */
export function actionsProvider(orgId, _profile, cb) {
  if (!orgId) return () => {}
  let templates = []
  let records = []

  const recompute = () => {
    const today = formatDateOnly(new Date())
    const tasks = buildScheduledTasks({ templates, records, currentMonth: new Date() })
    const items = tasks
      .filter((t) => t.dueString && t.dueString <= today)
      .map((t) => ({
        id: `${t.templateId || t.id}:${t.siteId}:${t.dueString}`,
        appId: 'inspections',
        title: `${t.title}${t.siteName ? ` — ${t.siteName}` : ''}`,
        status: t.dueString < today ? 'Overdue' : 'Due today',
        dueDate: t.dueString,
        severity: t.dueString < today ? 'high' : 'medium',
        deepLink: '/apps/inspections/overdue',
      }))
    cb(items)
  }

  const u1 = subscribeTemplates(orgId, (list) => {
    templates = list.map((t) => ({ ...t, fields: normalizeTemplateFields(t.fields || []) }))
    recompute()
  })
  const u2 = subscribeRecords(orgId, (list) => {
    records = list
    recompute()
  })
  return () => { u1 && u1(); u2 && u2() }
}
