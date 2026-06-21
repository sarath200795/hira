import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Users as UsersIcon, Check, X } from 'lucide-react'
import { PageHeader, Spinner, Badge } from '@unified/shared-ui'
import {
  useAuth,
  subscribeOrgUsers,
  setUserStatus,
  setUserRole,
  setAppRole,
  setAppAccess,
  appRoleSpecs,
} from '@unified/shared-auth'
import { apps } from '@unified/app-registry'

const PORTED_APPS = apps.filter((a) => !a.placeholder)

/** Unified User & Role Management — one cumulative tab for all apps. */
export default function UsersAdmin() {
  const { orgId, user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    const unsub = subscribeOrgUsers(orgId, (list) => { setUsers(list); setLoading(false) }, () => setLoading(false))
    return unsub
  }, [orgId])

  const guard = (fn) => async (...args) => {
    try { await fn(...args) } catch (e) { toast.error(e?.message || 'Update failed.') }
  }

  const pending = users.filter((u) => u.status !== 'approved')
  const approved = users.filter((u) => u.status === 'approved')

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Spinner size={28} className="text-brand-600" /></div>
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader title="User & Role Management" subtitle="Shared across all apps" icon={UsersIcon} />

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Pending approval ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.uid} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                <div>
                  <div className="font-medium text-ink-900">{u.name || u.email}</div>
                  <div className="text-sm text-ink-500">{u.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={guard(() => setUserStatus(u.uid, 'approved'))} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                    <Check size={15} /> Approve
                  </button>
                  <button onClick={guard(() => setUserStatus(u.uid, 'rejected'))} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
                    <X size={15} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Members ({approved.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-500">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Org role</th>
                <th className="px-4 py-3 font-medium">Per-app roles &amp; access</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((u) => (
                <tr key={u.uid} className="border-b border-ink-50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{u.name || u.email}</div>
                    <div className="text-xs text-ink-400">{u.email}</div>
                    {u.uid === me?.uid && <Badge color="#2563eb" className="mt-1">You</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => guard(() => setUserRole(u.uid, e.target.value))()}
                      disabled={u.uid === me?.uid}
                      className="rounded-lg border border-ink-200 px-2 py-1 text-sm disabled:opacity-60"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      {PORTED_APPS.map((app) => {
                        const spec = appRoleSpecs[app.id]
                        const current = u.appRoles?.[app.id] || spec?.default || ''
                        const enabled = u.isAdmin || u.appAccess?.[app.id] !== false
                        return (
                          <div key={app.id} className="min-w-[150px] rounded-lg border border-ink-100 p-2">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold" style={{ color: app.color }}>{app.title}</span>
                              <label className="flex items-center gap-1 text-[11px] text-ink-500">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  disabled={u.isAdmin}
                                  onChange={(e) => guard(() => setAppAccess(u.uid, app.id, e.target.checked))()}
                                />
                                access
                              </label>
                            </div>
                            {spec ? (
                              <select
                                value={current}
                                onChange={(e) => guard(() => setAppRole(u.uid, app.id, e.target.value))()}
                                className="w-full rounded border border-ink-200 px-1.5 py-1 text-xs"
                              >
                                {spec.roles.map((r) => (
                                  <option key={r} value={r}>{spec.labels?.[r] || r}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[11px] text-ink-400">role n/a</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
