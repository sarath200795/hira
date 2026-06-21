import { lazy, Suspense, useMemo } from 'react'
import { useParams, NavLink, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@unified/shared-auth'
import { FullScreenLoader } from '@unified/shared-ui'
import { getApp } from '@unified/app-registry'
import AppPlaceholder from './AppPlaceholder.jsx'

// Cache one lazy component per app id so we don't recreate it on every render.
const lazyCache = new Map()

function getLazyApp(mod) {
  if (lazyCache.has(mod.id)) return lazyCache.get(mod.id)
  const Lazy = lazy(async () => {
    const m = await mod.load()
    const Provider = m.Provider || (({ children }) => children)
    const AppRoutes = m.Routes
    const nav = m.nav || []
    const Root = () => (
      <div className="flex flex-col min-h-screen">
        {nav.length > 0 && <AppSubNav basePath={mod.basePath} nav={nav} title={mod.title} />}
        <div className="flex-1 min-w-0">
          <Provider>
            <AppRoutes />
          </Provider>
        </div>
      </div>
    )
    return { default: Root }
  })
  lazyCache.set(mod.id, Lazy)
  return Lazy
}

function AppSubNav({ basePath, nav, title }) {
  return (
    <div className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
        <span className="mr-2 text-sm font-bold text-ink-900 whitespace-nowrap">{title}</span>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={`${basePath}/${item.to}`}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default function AppMountPoint() {
  const { appId } = useParams()
  const mod = getApp(appId)

  if (!mod) return <Navigate to="/dashboard" replace />
  if (mod.placeholder) return <AppPlaceholder mod={mod} />

  const LazyApp = useMemo(() => getLazyApp(mod), [mod.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProtectedRoute access={{ id: mod.id, ...mod.access }}>
      <Suspense fallback={<FullScreenLoader label={`Loading ${mod.title}…`} />}>
        <LazyApp />
      </Suspense>
    </ProtectedRoute>
  )
}
