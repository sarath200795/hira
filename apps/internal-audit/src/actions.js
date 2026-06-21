import { subscribeFindings } from './services/findings'
import { subscribeCapas } from './services/capa'

const SEV = { major: 'high', minor: 'medium', observation: 'low' }
const OPEN_FINDING = (s) => s !== 'closed'
const OPEN_CAPA = (s) => s !== 'closed' && s !== 'verified'

/**
 * internal-audit actionsProvider — feeds the cumulative Action Tracker with
 * open audit findings and open CAPAs. Re-emits when either collection changes.
 *
 * Signature: (orgId, profile, cb) => unsubscribe
 */
export function actionsProvider(orgId, _profile, cb) {
  if (!orgId) return () => {}
  let findings = []
  let capas = []

  const recompute = () => {
    const fromFindings = findings
      .filter((f) => OPEN_FINDING(f.status))
      .map((f) => ({
        id: `finding:${f.id}`,
        appId: 'internal-audit',
        title: f.title || f.description || 'Audit finding',
        status: f.status || 'open',
        dueDate: f.dueDate || null,
        severity: SEV[f.severity] || 'medium',
        deepLink: '/apps/internal-audit/findings',
      }))
    const fromCapas = capas
      .filter((c) => OPEN_CAPA(c.status))
      .map((c) => ({
        id: `capa:${c.id}`,
        appId: 'internal-audit',
        title: c.title || c.action || c.correctiveAction || 'CAPA',
        status: c.status || 'open',
        dueDate: c.dueDate || c.targetDate || null,
        severity: 'medium',
        deepLink: '/apps/internal-audit/capa',
      }))
    cb([...fromFindings, ...fromCapas])
  }

  const u1 = subscribeFindings(orgId, (list) => { findings = list; recompute() })
  const u2 = subscribeCapas(orgId, (list) => { capas = list; recompute() })
  return () => { u1 && u1(); u2 && u2() }
}
