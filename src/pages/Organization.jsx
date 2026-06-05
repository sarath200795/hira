import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, Plus, X, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, EmptyState } from '../components/ui'
import { useRa } from '../context/RaContext'
import { useAuth } from '../context/AuthContext'
import { updateOrgSites } from '../lib/firestore'

export default function Organization() {
  const { org, sites } = useRa()
  const { orgId, orgName } = useAuth()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async (next) => {
    setBusy(true)
    try {
      await updateOrgSites(orgId, next)
    } catch (e) {
      toast.error(e.message || 'Could not save sites')
    } finally {
      setBusy(false)
    }
  }

  const addSite = async () => {
    const name = draft.trim()
    if (!name) return
    if (sites.some((s) => s.toLowerCase() === name.toLowerCase())) {
      toast.error('That site already exists')
      return
    }
    setDraft('')
    await save([...sites, name].sort((a, b) => a.localeCompare(b)))
    toast.success(`Added “${name}”`)
  }

  const removeSite = async (name) => {
    await save(sites.filter((s) => s !== name))
    toast.success(`Removed “${name}”`)
  }

  return (
    <div>
      <PageHeader title="Organization" subtitle="Manage your organization’s sites / facilities." icon={Building2} />

      {/* Org details */}
      <div className="card mb-4 grid gap-4 p-5 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-clay-surface text-brand-600 shadow-clay-inset"><Building2 size={16} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Organization</p>
            <p className="font-semibold text-ink-900">{org?.name || orgName || '—'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-clay-surface text-brand-600 shadow-clay-inset"><MapPin size={16} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Address</p>
            <p className="font-semibold text-ink-900">{org?.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Sites manager */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Layers size={18} className="text-brand-600" />
          <h3 className="font-bold text-ink-900">Sites / Facilities</h3>
          <span className="ml-auto text-xs font-semibold text-ink-400">{sites.length} site{sites.length === 1 ? '' : 's'}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <input
              className="input"
              placeholder="Add a site, e.g. HYD8"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSite() } }}
            />
          </div>
          <button className="btn-primary" onClick={addSite} disabled={busy || !draft.trim()}>
            <Plus size={16} /> Add site
          </button>
        </div>

        <div className="mt-4">
          {sites.length === 0 ? (
            <EmptyState icon={Layers} title="No sites yet" hint="Add your organization’s sites here. They’ll appear as a dropdown when creating risk assessments and as a filter on the dashboard." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {sites.map((s) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="chip bg-brand-50 text-brand-700"
                >
                  <Building2 size={13} /> {s}
                  <button onClick={() => removeSite(s)} disabled={busy} className="ml-1 rounded-full p-0.5 text-brand-400 hover:bg-brand-100 hover:text-brand-700" title="Remove site">
                    <X size={13} />
                  </button>
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
