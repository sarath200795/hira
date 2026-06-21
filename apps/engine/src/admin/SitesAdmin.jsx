import { useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, EmptyState, Modal } from '@unified/shared-ui'
import { useAuth } from '@unified/shared-auth'
import { useSites, addSite, updateSite, deleteSite } from '@unified/shared-sites'

const EMPTY = { name: '', code: '', address: '', location: '' }

/** Unified Site Management — one cumulative tab shared by every app. */
export default function SitesAdmin() {
  const { orgId, user } = useAuth()
  const { sites, loading } = useSites(orgId)
  const [editing, setEditing] = useState(null) // null | {} | site
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const openNew = () => { setForm(EMPTY); setEditing({}) }
  const openEdit = (s) => { setForm({ name: s.name || '', code: s.code || '', address: s.address || '', location: s.location || '' }); setEditing(s) }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Site name is required.')
    setSaving(true)
    try {
      if (editing?.id) {
        await updateSite(orgId, editing.id, { name: form.name.trim(), code: form.code.trim(), address: form.address.trim(), location: form.location.trim() })
        toast.success('Site updated.')
      } else {
        await addSite(orgId, form, user)
        toast.success('Site added.')
      }
      setEditing(null)
    } catch (err) {
      toast.error(err?.message || 'Could not save site.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s) => {
    if (!confirm(`Delete site "${s.name}"? Records referencing it will keep their saved values.`)) return
    try {
      await deleteSite(orgId, s.id)
      toast.success('Site deleted.')
    } catch (err) {
      toast.error(err?.message || 'Could not delete site.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader title="Site Management" subtitle="Shared across all apps" icon={MapPin}>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={16} /> Add site
        </button>
      </PageHeader>

      {loading ? (
        <p className="text-ink-500">Loading sites…</p>
      ) : sites.length === 0 ? (
        <EmptyState icon={MapPin} title="No sites yet" hint="Add your facilities, plants or locations once — every app uses the same list." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sites.map((s) => (
            <div key={s.id} className="flex items-start justify-between rounded-xl border border-ink-100 bg-white p-4">
              <div className="min-w-0">
                <div className="font-semibold text-ink-900">{s.name}</div>
                {s.code && <div className="text-xs text-ink-400">Code: {s.code}</div>}
                {s.address && <div className="text-sm text-ink-500 truncate">{s.address}</div>}
                {s.active === false && <span className="text-xs text-amber-600">Inactive</span>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-50"><Pencil size={16} /></button>
                <button onClick={() => remove(s)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit site' : 'Add site'}>
        <form onSubmit={save} className="space-y-3">
          {['name', 'code', 'address', 'location'].map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-sm font-medium capitalize text-ink-700">{k}{k === 'name' ? ' *' : ''}</span>
              <input value={form[k]} onChange={set(k)} required={k === 'name'} className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>
          ))}
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save site'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
