import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, Legend,
} from 'recharts'
import {
  LayoutDashboard, ClipboardList, AlertTriangle, ShieldCheck, CheckCircle2, FilePlus2, Flame,
  Filter, Search, X, CalendarClock, Clock,
} from 'lucide-react'
import { PageHeader, EmptyState } from '../components/ui'
import CountUp from '../components/CountUp'
import { useRa } from '../context/RaContext'
import { summarize } from '../lib/raStats'
import { BANDS } from '../lib/riskMatrix'
import { CONTROL_STATUS, CONTROL_HIERARCHY } from '../lib/constants'

const card = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
}
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort()

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`card p-5 ${className}`}
    >
      <div className="mb-3">
        <h3 className="font-bold text-ink-900">{title}</h3>
        {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}

function Empty() {
  return <div className="flex h-56 items-center justify-center text-sm text-ink-400">No data yet</div>
}

function Donut({ data }) {
  if (!data.length) return <Empty />
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={3}>
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Horizontal bar chart for the hierarchy-of-controls breakdown.
function HierBar({ data }) {
  if (!data.some((d) => d.value > 0)) return <Empty />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28 }}>
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#1c2230' }} />
        <Tooltip cursor={{ fill: 'rgba(227,204,191,0.35)' }} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          <LabelList dataKey="value" position="right" fontSize={12} fontWeight={800} fill="#1c2230" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Dashboard() {
  const { assessments, loading, sites: orgSites } = useRa()

  const [site, setSite] = useState('')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')

  const sites = useMemo(() => uniq([...orgSites, ...assessments.map((a) => a.siteName)]), [orgSites, assessments])
  const locations = useMemo(() => uniq(assessments.map((a) => a.location)), [assessments])
  const titles = useMemo(() => uniq(assessments.map((a) => a.name)), [assessments])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assessments.filter((a) => {
      if (site && a.siteName !== site) return false
      if (location && a.location !== location) return false
      if (title && a.name !== title) return false
      if (q && !`${a.name} ${a.siteName} ${a.location}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [assessments, site, location, title, search])

  const summary = useMemo(() => summarize(filtered), [filtered])
  const filtersActive = site || location || title || search
  const clearAll = () => { setSite(''); setLocation(''); setTitle(''); setSearch('') }

  const bandData = useMemo(
    () => BANDS.map((b) => ({ name: b.label, value: summary.byBand[b.key] || 0, color: b.color })).filter((d) => d.value > 0),
    [summary]
  )
  const activityData = useMemo(
    () => Object.entries(summary.byActivity).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 12),
    [summary]
  )
  const statusData = useMemo(
    () => CONTROL_STATUS.map((s) => ({ name: s.label, value: summary.controlStatus[s.key] || 0, color: s.color })).filter((d) => d.value > 0),
    [summary]
  )
  const actionData = useMemo(
    () => CONTROL_STATUS.map((s) => ({ name: s.label, value: summary.actionStatus[s.key] || 0, color: s.color })).filter((d) => d.value > 0),
    [summary]
  )
  const existingByType = useMemo(
    () => CONTROL_HIERARCHY.map((x) => ({ name: x.label, value: summary.controlsByHierarchy[x.key] || 0, color: x.color })),
    [summary]
  )
  const additionalByType = useMemo(
    () => CONTROL_HIERARCHY.map((x) => ({ name: x.label, value: summary.additionalByHierarchy[x.key] || 0, color: x.color })),
    [summary]
  )

  const kpis = [
    { label: 'Risk Assessments', value: summary.totalAssessments, color: '#1c2230', icon: ClipboardList },
    { label: 'Total Hazards', value: summary.totalHazards, color: '#4d5a73', icon: AlertTriangle },
    { label: 'Under Permissible Risk', value: summary.permissible, color: '#16a34a', icon: ShieldCheck },
    { label: 'ALARP Risks', value: summary.alarp, color: '#d97706', icon: CheckCircle2 },
    { label: 'High & Critical', value: summary.highCritical, color: '#dc2626', icon: Flame },
    { label: 'Open Actions', value: summary.openActions, color: '#2563eb', icon: CalendarClock, to: '/app/action-tracker' },
    { label: 'Overdue Actions', value: summary.overdueActions, color: '#b91c1c', icon: Clock, to: '/app/action-tracker' },
  ]

  const hasAny = assessments.length > 0

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Risk overview across all assessments." icon={LayoutDashboard}>
        <Link to="/app/create" className="btn-primary"><FilePlus2 size={16} /> New assessment</Link>
      </PageHeader>

      {!hasAny && !loading ? (
        <EmptyState
          icon={ClipboardList}
          title="No risk assessments yet"
          hint="Create your first hazard identification & risk assessment to populate the dashboard."
          action={<Link to="/app/create" className="btn-primary mt-2"><FilePlus2 size={16} /> Create assessment</Link>}
        />
      ) : (
        <>
          {/* Filter bar */}
          <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ink-400">
              <Filter size={13} /> Filters
            </span>
            <div className="relative min-w-[180px] flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">All sites</option>
              {sites.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input w-auto" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All locations</option>
              {locations.map((l) => <option key={l}>{l}</option>)}
            </select>
            <select className="input w-auto" value={title} onChange={(e) => setTitle(e.target.value)}>
              <option value="">All assessments</option>
              {titles.map((t) => <option key={t}>{t}</option>)}
            </select>
            {filtersActive && (
              <button className="btn-ghost px-2.5 py-1 text-xs" onClick={clearAll}><X size={12} /> Clear</button>
            )}
          </div>

          {/* KPI cards */}
          <div data-tour="dash-kpis" className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {kpis.map((k, i) => {
              const inner = (
                <>
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10 transition group-hover:scale-150" style={{ backgroundColor: k.color }} />
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: k.color }}>
                    <k.icon size={20} />
                  </div>
                  <p className="text-3xl font-black text-ink-900"><CountUp value={k.value} /></p>
                  <p className="text-sm font-medium text-ink-500">{k.label}</p>
                </>
              )
              const cls = 'card group relative block overflow-hidden p-5'
              // Tint the tile with its risk-level colour for easy identification.
              const tileStyle = { backgroundColor: `${k.color}14`, boxShadow: `inset 4px 0 0 ${k.color}` }
              return (
                <motion.div
                  key={k.label}
                  variants={card}
                  custom={i}
                  initial="hidden"
                  animate="show"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                >
                  {k.to
                    ? <Link to={k.to} className={cls} style={tileStyle}>{inner}</Link>
                    : <div className={cls} style={tileStyle}>{inner}</div>}
                </motion.div>
              )
            })}
          </div>

          {/* Risk band legend */}
          <ChartCard title="Risk levels" subtitle="5×5 risk bands (residual risk)" className="mb-4">
            <div className="flex flex-wrap gap-2">
              {BANDS.map((b) => (
                <span key={b.key} className="chip" style={{ backgroundColor: `${b.color}1a`, color: b.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.label}
                  <span className="ml-1 rounded-full bg-white/70 px-1.5 text-[10px] font-bold text-ink-700">{summary.byBand[b.key] || 0}</span>
                </span>
              ))}
            </div>
          </ChartCard>

          <div data-tour="dash-charts" className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="By Risk Level" subtitle="Share of hazards per band">
              <Donut data={bandData} />
            </ChartCard>

            <ChartCard title="Count in each Risk Level" subtitle="Hazard count per band">
              {bandData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={bandData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} tick={{ fill: '#1c2230' }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} tick={{ fill: '#62718c' }} />
                    <Tooltip cursor={{ fill: 'rgba(227,204,191,0.35)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {bandData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      <LabelList dataKey="value" position="top" fontSize={13} fontWeight={800} fill="#1c2230" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            {/* Control actions (CAPA) status */}
            <ChartCard title="Control Actions (CAPA)" subtitle={`Additional-control status · ${summary.overdueActions} overdue`}>
              <Donut data={actionData} />
              <div className="mt-2 text-center">
                <Link to="/app/action-tracker" className="text-xs font-semibold text-brand-600 hover:underline">Open Action Tracker →</Link>
              </div>
            </ChartCard>

            <ChartCard title="Control Measures" subtitle="All controls — implementation status">
              <Donut data={statusData} />
            </ChartCard>

            {/* Type of control (hierarchy) — existing vs additional */}
            <ChartCard title="Existing Controls by Type" subtitle="Hierarchy of controls">
              <HierBar data={existingByType} />
            </ChartCard>

            <ChartCard title="Additional Controls by Type" subtitle="Hierarchy of controls (CAPA)">
              <HierBar data={additionalByType} />
            </ChartCard>

            <ChartCard title="By Activity" subtitle="Hazards identified per activity / task" className="lg:col-span-3">
              {activityData.length ? (
                <ResponsiveContainer width="100%" height={Math.max(240, activityData.length * 34)}>
                  <BarChart data={activityData} layout="vertical" margin={{ left: 8, right: 28 }}>
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis type="category" dataKey="name" width={180} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#1c2230' }} />
                    <Tooltip cursor={{ fill: 'rgba(227,204,191,0.35)' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#3b82f6">
                      <LabelList dataKey="value" position="right" fontSize={13} fontWeight={800} fill="#1c2230" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
