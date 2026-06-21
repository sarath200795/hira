import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, ExternalLink, AlertTriangle } from 'lucide-react'
import { PageHeader, EmptyState, Spinner, Badge } from '@unified/shared-ui'
import { useAuth, canAccessApp } from '@unified/shared-auth'
import { apps, appsById } from '@unified/app-registry'

const SEV_COLOR = { high: '#dc2626', medium: '#f59e0b', low: '#16a34a' }

/**
 * Cumulative cross-module Action Tracker. Loads each accessible app module,
 * subscribes to its `actionsProvider(orgId, profile, cb)`, and merges the
 * normalized ActionItems into one list. Apps without actions are skipped.
 */
export default function ActionTracker() {
  const { orgId, profile } = useAuth()
  const [byApp, setByApp] = useState({}) // { appId: ActionItem[] }
  const [loadingApps, setLoadingApps] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('all')

  const accessibleApps = useMemo(
    () => apps.filter((a) => !a.placeholder && canAccessApp(profile, a)),
    [profile]
  )

  useEffect(() => {
    if (!orgId) return
    let cancelled = false
    const unsubs = []
    setLoadingApps(true)

    Promise.all(
      accessibleApps.map(async (app) => {
        try {
          const mod = await app.load()
          if (cancelled || typeof mod.actionsProvider !== 'function') return
          const unsub = mod.actionsProvider(orgId, profile, (items) => {
            setByApp((prev) => ({ ...prev, [app.id]: items || [] }))
          })
          if (typeof unsub === 'function') unsubs.push(unsub)
        } catch {
          /* app has no actions module — ignore */
        }
      })
    ).then(() => {
      if (!cancelled) setLoadingApps(false)
    })

    return () => {
      cancelled = true
      unsubs.forEach((u) => u && u())
    }
  }, [orgId, profile, accessibleApps])

  const items = useMemo(() => {
    let all = Object.values(byApp).flat()
    if (moduleFilter !== 'all') all = all.filter((i) => i.appId === moduleFilter)
    return all.sort((a, b) => {
      const ad = a.dueDate || '9999-12-31'
      const bd = b.dueDate || '9999-12-31'
      return ad.localeCompare(bd)
    })
  }, [byApp, moduleFilter])

  const modulesWithItems = useMemo(
    () => Object.keys(byApp).filter((id) => (byApp[id] || []).length > 0),
    [byApp]
  )

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader
        title="Action Tracker"
        subtitle="All pending actions across every module"
        icon={ListChecks}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip active={moduleFilter === 'all'} onClick={() => setModuleFilter('all')}>
          All modules ({Object.values(byApp).flat().length})
        </FilterChip>
        {modulesWithItems.map((id) => (
          <FilterChip key={id} active={moduleFilter === id} onClick={() => setModuleFilter(id)}>
            {appsById[id]?.title || id} ({byApp[id].length})
          </FilterChip>
        ))}
      </div>

      {loadingApps && items.length === 0 ? (
        <div className="grid place-items-center py-16">
          <Spinner size={28} className="text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No pending actions"
          hint="Outstanding actions from all your modules will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ActionRow key={`${item.appId}:${item.id}`} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
      }`}
    >
      {children}
    </button>
  )
}

function ActionRow({ item }) {
  const app = appsById[item.appId]
  const overdue = item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-ink-100 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {app && (
            <Badge color={app.color}>{app.title}</Badge>
          )}
          {item.severity && <Badge color={SEV_COLOR[item.severity] || '#64748b'}>{item.severity}</Badge>}
          {overdue && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle size={13} /> Overdue
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-medium text-ink-900">{item.title}</p>
        <p className="text-xs text-ink-500">
          {item.status}
          {item.dueDate ? ` · due ${item.dueDate}` : ''}
          {item.assignee ? ` · ${item.assignee}` : ''}
        </p>
      </div>
      {item.deepLink && (
        <Link
          to={item.deepLink}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Open <ExternalLink size={14} />
        </Link>
      )}
    </li>
  )
}
