import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { ListChecks, ArrowRight } from 'lucide-react'
import { useAuth, canAccessApp } from '@unified/shared-auth'
import { apps } from '@unified/app-registry'

function Tile({ app }) {
  const Icon = app.icon
  const disabled = app.placeholder
  const inner = (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-clay-sm transition ${
        disabled ? 'border-ink-100 opacity-80' : 'border-ink-100 hover:-translate-y-0.5 hover:shadow-card'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className="grid h-12 w-12 place-items-center rounded-xl text-white"
          style={{ backgroundColor: app.color }}
        >
          <Icon size={24} />
        </div>
        {disabled ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            Coming soon
          </span>
        ) : (
          <ArrowRight size={18} className="text-ink-300 transition group-hover:text-brand-600" />
        )}
      </div>
      <h3 className="mt-4 text-base font-bold text-ink-900">{app.title}</h3>
      <p className="mt-1 text-sm text-ink-500">{app.description}</p>
    </div>
  )
  if (disabled) return <div>{inner}</div>
  return <Link to={app.basePath}>{inner}</Link>
}

export default function Dashboard() {
  const { profile, orgName } = useAuth()
  const visible = useMemo(() => apps.filter((a) => canAccessApp(profile, a)), [profile])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}</h1>
        <p className="text-ink-500">{orgName ? `${orgName} · ` : ''}Choose an app to get started.</p>
      </div>

      {/* Action Tracker tile — cumulative across all modules */}
      <Link
        to="/action-tracker"
        className="mb-6 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 p-5 transition hover:shadow-card"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white">
            <ListChecks size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-900">Action Tracker</h3>
            <p className="text-sm text-ink-500">All pending actions across every module, in one place.</p>
          </div>
        </div>
        <ArrowRight className="text-brand-600" />
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((app) => (
          <Tile key={app.id} app={app} />
        ))}
      </div>
    </div>
  )
}
