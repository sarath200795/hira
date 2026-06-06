// ─────────────────────────────────────────────────────────────────────────────
// HIRA Guide — rule-based insight engine. Pure functions over the live org data
// (no LLM): per-page onboarding tips, suggested questions, and a keyword-matching
// answer() that reports counts/examples from the dashboard summary, risk lists,
// CAPA actions and the activity log.
// ─────────────────────────────────────────────────────────────────────────────
import { riskLists, flattenAdditionalControls, isOverdue, residualRisk } from './raStats'
import { categoryLabel } from './constants'

const pageOf = (pathname = '') => {
  if (pathname.includes('/risk-register')) return 'risk-register'
  if (pathname.includes('/action-tracker')) return 'action-tracker'
  if (pathname.includes('/repository')) return 'repository'
  if (pathname.includes('/create')) return 'create'
  if (pathname.includes('/bulk-import')) return 'bulk-import'
  if (pathname.includes('/organization')) return 'organization'
  if (pathname.includes('/assessment/')) return 'assessment'
  return 'dashboard'
}

const GUIDES = {
  dashboard: {
    title: 'Dashboard',
    tips: [
      'This is your live risk overview. Use the Site / Location / Title filters to focus the charts.',
      'Tiles are colour-coded by risk level — “Under Permissible Risk”, “ALARP”, “High & Critical”.',
      'Watch “Overdue Actions” — click it to jump to the Action Tracker.',
    ],
  },
  create: {
    title: 'Create Risk Assessment',
    tips: [
      'Section 1 = details (pick a Site from the dropdown, or add one with ＋).',
      'Section 2 = add internal/external members; internal ones can own controls.',
      'Section 3 = activities → hazards. Pick Group → Category → Type, set Probability × Severity and the matrix scores it.',
      'Add additional controls + projected risk; tick ALARP to accept the residual risk.',
    ],
  },
  repository: {
    title: 'Repository',
    tips: [
      'Every saved assessment lives here. Filter by Site, Name or Location.',
      'Hover a row for actions: view, export PDF, edit, delete.',
    ],
  },
  'risk-register': {
    title: 'Risk Register',
    tips: [
      'Risks grouped by severity (Critical/High/ALARP) and acceptability (initial vs residual).',
      'The “Action Required” tab lists non-acceptable residual risks — add controls or declare ALARP right there.',
    ],
  },
  'action-tracker': {
    title: 'Action Tracker',
    tips: [
      'All additional controls (CAPA) with their status and due dates.',
      'Filter by status or risk focus; overdue actions are flagged red. Change status inline.',
    ],
  },
  'bulk-import': {
    title: 'Bulk Import',
    tips: [
      'Download the CSV template, fill one row per hazard/control, then upload to import many at once.',
    ],
  },
  organization: {
    title: 'Organization',
    tips: [
      'Add your sites/facilities here — they become the Site dropdown in assessments and a dashboard filter.',
    ],
  },
  assessment: {
    title: 'Assessment',
    tips: ['Full read-only breakdown. Use Export PDF for the ISO-format document, or Edit to change it.'],
  },
}

export function pageGuide(pathname) {
  return GUIDES[pageOf(pathname)] || GUIDES.dashboard
}

const COMMON_QS = ['How many overdue actions?', 'What are my critical risks?', 'Recent activity?']
const PAGE_QS = {
  dashboard: ['How many assessments?', 'Which site has the most hazards?', 'How many open actions?'],
  'risk-register': ['How many non-acceptable residual risks?', 'How many ALARP?', 'What are my high risks?'],
  'action-tracker': ['What’s overdue?', 'How many open actions?', 'Recent activity?'],
  repository: ['How many assessments?', 'How many hazards?', 'Which site has the most hazards?'],
  create: ['What counts as acceptable risk?', 'When should I declare ALARP?'],
  organization: ['Which site has the most hazards?', 'How many sites?'],
}
export function suggestedQuestions(pathname) {
  const p = pageOf(pathname)
  return [...(PAGE_QS[p] || []), ...COMMON_QS].slice(0, 5)
}

// ── Answering ────────────────────────────────────────────────────────────────
const list = (names, n = 3) => {
  const shown = names.slice(0, n)
  const extra = names.length - shown.length
  return shown.join(', ') + (extra > 0 ? ` and ${extra} more` : '')
}

function timeAgo(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null
    if (!d) return ''
    const s = Math.floor((Date.now() - d.getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  } catch {
    return ''
  }
}

function siteBreakdown(assessments) {
  const m = {}
  for (const a of assessments) {
    const site = a.siteName || 'Unspecified'
    const n = (a.activities || []).reduce((c, act) => c + (act.hazards?.length || 0), 0)
    m[site] = (m[site] || 0) + n
  }
  return Object.entries(m).sort((x, y) => y[1] - x[1])
}

/**
 * Answer a free-text question from the live data context.
 * ctx = { summary, assessments, activity, sites, pathname }
 */
export function answer(question, ctx) {
  const q = (question || '').toLowerCase()
  const { summary, assessments = [], activity = [], sites = [] } = ctx
  const lists = riskLists(assessments)
  const actions = flattenAdditionalControls(assessments)

  const has = (...words) => words.some((w) => q.includes(w))

  // Recent activity / who did what
  if (has('recent', 'activity', 'who ', 'who did', 'changed', 'history', 'log', 'lately')) {
    if (!activity.length) return 'No recorded activity yet. Actions like creating assessments, changing control status or declaring ALARP will show up here.'
    const lines = activity.slice(0, 5).map((e) => `• ${e.actorName} ${e.message} (${timeAgo(e.at)})`)
    return `Recent activity:\n${lines.join('\n')}`
  }

  // Overdue actions
  if (has('overdue')) {
    const od = actions.filter((r) => isOverdue(r.control))
    if (!od.length) return 'No overdue actions — nice. An action is overdue when its due date has passed and it isn’t Implemented.'
    return `${od.length} overdue action(s): ${list(od.map((r) => r.control.description || r.control.hierarchy))}. Open the Action Tracker to address them.`
  }

  // Open / in-progress actions
  if (has('open action', 'open actions', 'in progress', 'pending action', 'capa')) {
    const open = actions.filter((r) => ['Open', 'In Progress'].includes(r.control.status || 'Open'))
    return `${open.length} open action(s) (Open or In Progress) out of ${actions.length} additional control(s). ${summary?.overdueActions || 0} are overdue.`
  }

  // Critical / high
  if (has('critical')) {
    const r = lists.critical
    return r.length
      ? `${r.length} hazard(s) at Critical residual risk: ${list(r.map((x) => x.hazard.hazardType || categoryLabel(x.hazard.hazardCategory)))}.`
      : 'No hazards at Critical residual risk.'
  }
  if (has('high risk', 'high risks', ' high')) {
    const r = lists.high
    return r.length
      ? `${r.length} hazard(s) at High residual risk: ${list(r.map((x) => x.hazard.hazardType || categoryLabel(x.hazard.hazardCategory)))}.`
      : 'No hazards at High residual risk.'
  }

  // ALARP
  if (has('alarp')) {
    return `${lists.alarp.length} hazard(s) accepted as ALARP. Declare ALARP when a residual risk can’t reasonably be reduced further.`
  }

  // Acceptable / non-acceptable
  if (has('non-acceptable', 'not acceptable', 'unacceptable')) {
    return `Residual: ${lists.nonAcceptableResidual.length} non-acceptable. Initial: ${lists.nonAcceptableInitial.length} non-acceptable. (Non-acceptable = risk score ≥ 7.) ${lists.actionRequired.length} need action (non-acceptable residual, not yet ALARP).`
  }
  if (has('acceptable')) {
    return `Acceptable = risk score 1–6 (Negligible/Low/Medium). Acceptable residual: ${lists.acceptableResidual.length}; non-acceptable residual: ${lists.nonAcceptableResidual.length}.`
  }
  if (has('action required', 'need action', 'needs action')) {
    return lists.actionRequired.length
      ? `${lists.actionRequired.length} hazard(s) need action — non-acceptable residual risk and not yet ALARP. See the Action Required tab in the Risk Register.`
      : 'Nothing needs action — all residual risks are acceptable or ALARP-accepted.'
  }

  // Sites
  if (has('site')) {
    if (has('how many') ) return `${sites.length} site(s) configured${sites.length ? `: ${list(sites, 5)}` : ''}.`
    const bd = siteBreakdown(assessments)
    if (!bd.length) return 'No hazards recorded yet.'
    return `Busiest site by hazards: ${bd[0][0]} (${bd[0][1]}). ${bd.length > 1 ? `Next: ${bd.slice(1, 3).map(([s, n]) => `${s} (${n})`).join(', ')}.` : ''}`
  }

  // Activities
  if (has('activit', 'task')) {
    const top = Object.entries(summary?.byActivity || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return top.length ? `Top activities by hazards: ${top.map(([a, n]) => `${a} (${n})`).join(', ')}.` : 'No activities recorded yet.'
  }

  // Totals
  if (has('how many assessment', 'assessments', 'total assessment')) {
    return `${summary?.totalAssessments || 0} risk assessment(s) with ${summary?.totalHazards || 0} hazard(s) in total.`
  }
  if (has('hazard')) {
    return `${summary?.totalHazards || 0} hazard(s) across ${summary?.totalAssessments || 0} assessment(s). ${summary?.permissible || 0} are under permissible risk; ${summary?.highCritical || 0} are High or Critical.`
  }
  if (has('control', 'type of control')) {
    return `${summary?.totalControls || 0} control(s) total. Additional controls (CAPA): ${actions.length}, of which ${summary?.openActions || 0} open.`
  }

  // Greetings / help
  if (has('hello', 'hi ', 'hey', 'help', 'what can you')) {
    return 'Hi! I can report on your risks and actions. Try: “overdue actions”, “critical risks”, “which site has the most hazards”, or “recent activity”.'
  }

  return `I’m not sure about that one. Try asking about: overdue actions, critical/high risks, acceptable vs non-acceptable, ALARP, sites, activities, totals, or recent activity.`
}
