import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, CalendarClock, CheckCircle2, AlertTriangle,
  Plus, ArrowRight, TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../components/ui'
import SiteFilter from '../components/SiteFilter'
import { useAuth } from '@unified/shared-auth'
import { useData } from '../context/DataContext'

function Stat({ icon: Icon, label, value, tone = 'brand', onClick }) {
  const tones = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="card flex items-center gap-4 p-5 text-left transition hover:shadow-glow"
    >
      <div className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-ink-900">{value}</p>
        <p className="text-xs font-semibold text-ink-500">{label}</p>
      </div>
    </motion.button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { activeTemplates, filteredRecords, scheduledTasks, overdueTasks, dueTodayTasks } = useData()

  const passRate = useMemo(() => {
    if (filteredRecords.length === 0) return null
    const passes = filteredRecords.filter((r) => r.passFailResult === 'PASS').length
    return Math.round((passes / filteredRecords.length) * 100)
  }, [filteredRecords])

  const recent = filteredRecords.slice(0, 6)

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title={`Welcome, ${profile?.name?.split(' ')[0] || 'there'}`} subtitle="Your organization's inspection overview">
        <SiteFilter />
        <button className="btn-primary" onClick={() => navigate('/apps/inspections/forms/new')}><Plus size={16} /> Create form</button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ClipboardList} label="Active forms" value={activeTemplates.length} tone="brand" onClick={() => navigate('/apps/inspections/forms')} />
        <Stat icon={CalendarClock} label="Due today" value={dueTodayTasks.length} tone="amber" onClick={() => navigate('/apps/inspections/schedule')} />
        <Stat icon={AlertTriangle} label="Overdue" value={overdueTasks.length} tone="red" onClick={() => navigate('/apps/inspections/overdue')} />
        <Stat icon={CheckCircle2} label="Completed" value={filteredRecords.length} tone="emerald" onClick={() => navigate('/apps/inspections/records')} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pass rate */}
        <div className="card p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800">
            <TrendingUp size={16} className="text-brand-600" /> Pass rate
          </div>
          {passRate === null ? (
            <p className="text-sm text-ink-400">No inspections completed yet.</p>
          ) : (
            <>
              <p className="text-4xl font-black text-ink-900">{passRate}%</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-clay-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${passRate}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-500">{filteredRecords.filter((r) => r.passFailResult === 'PASS').length} of {filteredRecords.length} inspections passed (≥90%).</p>
            </>
          )}
        </div>

        {/* Upcoming */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-800">Next up</span>
            <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => navigate('/apps/inspections/schedule')}>
              View schedule <ArrowRight size={12} className="inline" />
            </button>
          </div>
          {scheduledTasks.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing scheduled. Assign a form to get started.</p>
          ) : (
            <div className="space-y-2">
              {scheduledTasks.slice(0, 5).map((t, i) => (
                <button key={i} onClick={() => navigate('/apps/inspections/execute', { state: { task: { ...t, dueDate: undefined } } })}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-clay-surface px-4 py-2.5 text-left text-sm shadow-clay-sm transition hover:shadow-clay">
                  <span className="truncate font-semibold text-ink-800">{t.title}</span>
                  <span className="shrink-0 font-mono text-xs text-ink-500">{t.dueString}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent records */}
      <div className="card mt-6 p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink-800">Recent inspections</span>
          <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => navigate('/apps/inspections/records')}>
            All records <ArrowRight size={12} className="inline" />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-400">No completed inspections yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recent.map((r) => (
              <button key={r.id} onClick={() => navigate('/apps/inspections/records', { state: { recordId: r.id } })}
                className="flex items-center justify-between gap-3 rounded-xl bg-clay-surface px-4 py-2.5 text-left text-sm shadow-clay-sm transition hover:shadow-clay">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-800">{r.templateTitle}</span>
                  <span className="block truncate text-xs text-ink-400">{r.inspector} · {new Date(r.completedAt).toLocaleDateString()}</span>
                </span>
                <span className={`shrink-0 font-bold ${r.passFailResult === 'PASS' ? 'text-emerald-600' : 'text-red-600'}`}>{r.score}%</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
