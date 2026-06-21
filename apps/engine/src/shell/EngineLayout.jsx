import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import {
  LayoutGrid,
  ListChecks,
  MapPin,
  Users as UsersIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useAuth, canAccessApp } from '@unified/shared-auth'
import { apps } from '@unified/app-registry'

function SideLink({ to, icon: Icon, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive ? 'bg-brand-600 text-white shadow-clay-sm' : 'text-ink-600 hover:bg-ink-50'
        }`
      }
    >
      <Icon size={18} />
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

export default function EngineLayout() {
  const { profile, orgName, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const accessibleApps = useMemo(
    () => apps.filter((a) => !a.comingSoon && canAccessApp(profile, a)),
    [profile]
  )

  const onSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-clay-bg">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-ink-100 bg-white">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-ink-100">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <ShieldCheck size={20} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-ink-900">HSE Engine</div>
            <div className="text-xs text-ink-400 truncate max-w-[150px]">{orgName || '—'}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <SideLink to="/dashboard" icon={LayoutGrid}>Dashboard</SideLink>
          <SideLink to="/action-tracker" icon={ListChecks}>Action Tracker</SideLink>

          <div className="pt-3 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Apps
          </div>
          {accessibleApps.map((a) => (
            <SideLink key={a.id} to={a.basePath} icon={a.icon}>{a.title}</SideLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Administration
              </div>
              <SideLink to="/admin/sites" icon={MapPin}>Site Management</SideLink>
              <SideLink to="/admin/users" icon={UsersIcon}>User & Role Management</SideLink>
            </>
          )}
        </nav>

        <div className="border-t border-ink-100 p-3">
          <div className="px-3 py-2 text-xs text-ink-500">
            <div className="font-medium text-ink-700 truncate">{profile?.name || profile?.email}</div>
            <div className="truncate">{profile?.email}</div>
          </div>
          <button
            onClick={onSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
