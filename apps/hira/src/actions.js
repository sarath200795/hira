import { subscribeAssessments } from './lib/firestore'
import { flattenAdditionalControls, isNonAcceptable } from './lib/raStats'

const memberName = (members, id) => members?.find((m) => m.id === id)?.name || null

/**
 * hira actionsProvider — feeds the engine's cumulative Action Tracker.
 *
 * Maps every OPEN / IN-PROGRESS additional control across all risk assessments
 * to a normalized ActionItem. Subscribes live and re-emits on change.
 *
 * Signature: (orgId, profile, cb) => unsubscribe
 */
export function actionsProvider(orgId, _profile, cb) {
  if (!orgId) return () => {}
  return subscribeAssessments(
    orgId,
    (assessments) => {
      const rows = flattenAdditionalControls(assessments).filter((r) => {
        const st = r.control.status || 'Open'
        return st === 'Open' || st === 'In Progress'
      })
      const items = rows.map((r) => ({
        id: `${r.assessmentId}:${r.control.id}`,
        appId: 'hira',
        title: r.control.description || r.control.hierarchy || 'Risk control action',
        status: r.control.status || 'Open',
        dueDate: r.control.dueDate || null,
        severity: isNonAcceptable(r.residual) ? 'high' : isNonAcceptable(r.initial) ? 'medium' : 'low',
        assignee: memberName(r.members, r.control.responsibleMemberId),
        deepLink: `/apps/hira/assessment/${r.assessmentId}`,
      }))
      cb(items)
    },
    () => cb([])
  )
}
