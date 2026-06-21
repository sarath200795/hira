import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { PageHeader, EmptyState } from '../components/ui'
import { useAuth } from '@unified/shared-auth'
import { subscribeAuditLogs } from '../lib/firestore'

const ACTION_META = {
  'template.create': { label: 'Created form', color: '#16a34a' },
  'template.update': { label: 'Updated form', color: '#c026d3' },
  'template.delete': { label: 'Deleted form', color: '#dc2626' },
  'assignment.update': { label: 'Updated assignments', color: '#c026d3' },
  'inspection.submit': { label: 'Submitted inspection', color: '#0891b2' },
  'record.delete': { label: 'Deleted record', color: '#dc2626' },
  'site.create': { label: 'Created site', color: '#16a34a' },
  'site.update': { label: 'Updated site', color: '#c026d3' },
  'site.delete': { label: 'Deleted site', color: '#dc2626' },
  'user.status': { label: 'User status', color: '#f59e0b' },
  'user.role': { label: 'User role', color: '#c026d3' },
}
const metaFor = (a) => ACTION_META[a] || { label: a || 'Change', color: '#64748b' }

const fmt = (at) => {
  if (!at) return ''
  const d = at.toDate ? at.toDate() : new Date(at)
  return isNaN(d) ? '' : d.toLocaleString()
}

export default function AuditLog() {
  const { orgId } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    const unsub = subscribeAuditLogs(orgId, (l) => { setLogs(l); setLoading(false) })
    return unsub
  }, [orgId])

  return (
    <div>
      <PageHeader icon={ScrollText} title="Audit log" subtitle="An append-only trail of every change in your organization" />

      {!loading && logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" hint="Actions like creating forms and submitting inspections will be recorded here." />
      ) : (
        <div className="overflow-hidden card">
          <table className="w-full text-left text-sm">
            <thead className="bg-clay-surface text-[10px] uppercase tracking-widest text-ink-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const m = metaFor(l.action)
                return (
                  <tr key={l.id} className="border-t border-clay-200/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">{fmt(l.at)}</td>
                    <td className="px-4 py-3 text-ink-700">{l.actorName}</td>
                    <td className="px-4 py-3">
                      <span className="chip" style={{ backgroundColor: `${m.color}1a`, color: m.color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />{m.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{l.summary || l.targetLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
