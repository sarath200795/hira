import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LEGAL_PAGES } from '../lib/legal'
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  Upload,
  ShieldAlert,
  CalendarClock,
  LogOut,
  Menu,
} from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
          isActive
            ? 'bg-brand-500 text-white shadow-glow'
            : 'text-ink-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 -z-10 rounded-xl bg-brand-500"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <Icon size={18} className="shrink-0" />
          <span className="flex-1">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { profile, orgName, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  const doLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4">
      <div className="mb-4 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-glow">
          <Logo size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">HIRA</p>
          <p className="truncate text-xs text-ink-400">{orgName}</p>
        </div>
      </div>

      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">
        Overview
      </p>
      <NavItem to="/app/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={close} />
      <NavItem to="/app/repository" icon={FolderOpen} label="Repository" onClick={close} />
      <NavItem to="/app/risk-register" icon={ShieldAlert} label="Risk Register" onClick={close} />
      <NavItem to="/app/action-tracker" icon={CalendarClock} label="Action Tracker" onClick={close} />

      <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-ink-500">
        Manage
      </p>
      <NavItem to="/app/create" icon={FilePlus2} label="Create Risk Assessment" onClick={close} />
      <NavItem to="/app/bulk-import" icon={Upload} label="Bulk Import" onClick={close} />

      <div className="mt-auto pt-4">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
              {(profile?.name || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{profile?.name}</p>
              <p className="truncate text-[11px] capitalize text-ink-400">{profile?.role}</p>
            </div>
            <button
              onClick={doLogout}
              className="rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-clay-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink-950 shadow-clay lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 bg-ink-950 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-clay-bg/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 shadow-clay-sm transition hover:bg-clay-100 active:shadow-clay-pressed">
            <Menu size={20} />
          </button>
          <span className="flex items-center gap-2 font-extrabold">
            <Logo size={18} className="text-brand-500" /> HIRA
          </span>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="no-print mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-6 text-xs text-ink-400 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} HIRA</span>
          {LEGAL_PAGES.map((p) => (
            <Link key={p.kind} to={p.path} className="hover:text-ink-700">{p.label}</Link>
          ))}
        </footer>
      </div>
    </div>
  )
}
