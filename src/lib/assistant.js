// ─────────────────────────────────────────────────────────────────────────────
// HIRA Guide — rule-based insight engine. Pure functions over the live org data
// (no LLM): per-page onboarding tips, suggested questions, and a scored-intent
// answer() that understands free-typed questions (synonyms + entity lookups) and
// reports counts/examples from the dashboard summary, risk lists, CAPA actions
// and the activity log.
// ─────────────────────────────────────────────────────────────────────────────
import { riskLists, flattenAdditionalControls, flattenHazards, isOverdue } from './raStats'
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
  dashboard: ['Give me a summary', 'Which site has the most hazards?', 'What should I do first?'],
  'risk-register': ['How many non-acceptable residual risks?', 'How many ALARP?', 'What are my high risks?'],
  'action-tracker': ['What’s overdue?', 'How many open actions?', 'What should I do first?'],
  repository: ['How many assessments?', 'How many hazards?', 'Which site has the most hazards?'],
  create: ['What counts as acceptable risk?', 'When should I declare ALARP?'],
  organization: ['Which site has the most hazards?', 'How many sites?'],
}
export function suggestedQuestions(pathname) {
  const p = pageOf(pathname)
  return [...(PAGE_QS[p] || []), ...COMMON_QS].slice(0, 5)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

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

const hzLabel = (h) => h.hazardType || categoryLabel(h.hazardCategory) || 'hazard'
const isOpen = (c) => ['Open', 'In Progress'].includes(c?.status || 'Open')
const isHC = (risk) => risk?.key === 'high' || risk?.key === 'critical'
const worstResidual = (rows) =>
  rows.reduce((m, r) => (r.residual && (!m || (r.residual.score || 0) > (m.score || 0)) ? r.residual : m), null)

// answer() result wrappers: matched=true means a rule handled it; matched=false
// signals the caller (Assistant) to try the AI fallback.
const hit = (text) => ({ text, matched: true })
const miss = (text) => ({ text, matched: false })

// ── Answering ────────────────────────────────────────────────────────────────
/**
 * Answer a free-typed question from the live data context.
 * ctx = { summary, assessments, activity, sites, pathname }
 *
 * Strategy: (1) entity lookups when a known site/assessment name is mentioned,
 * (2) a scored intent registry (synonym keywords → handler; highest score wins),
 * (3) a helpful fallback that points at what the guide *can* answer.
 */
export function answer(question, ctx) {
  const { summary, assessments = [], activity = [], sites = [], pathname } = ctx || {}
  const qn = norm(question)
  if (!qn) return hit('Ask me anything about your risks — try “give me a summary” or “what’s overdue?”.')
  const tokens = new Set(qn.split(' '))

  const hazards = flattenHazards(assessments)
  const actions = flattenAdditionalControls(assessments)
  const lists = riskLists(assessments)

  // ── 1. Entity lookups (mention of a specific site or assessment by name) ─────
  const siteNames = Array.from(new Set([...sites, ...assessments.map((a) => a.siteName)].filter(Boolean)))
  const longestHit = (candidates, minLen) =>
    candidates
      .filter((c) => c && norm(c).length >= minLen && qn.includes(norm(c)))
      .sort((a, b) => norm(b).length - norm(a).length)[0] || null

  const siteHit = longestHit(siteNames, 2)
  const asmtHit = assessments.find((a) => a.name && norm(a.name).length >= 4 && qn.includes(norm(a.name)))

  // Prefer the more specific (longer) literal match.
  const preferAsmt = asmtHit && (!siteHit || norm(asmtHit.name).length >= norm(siteHit).length)

  if (preferAsmt) {
    const rows = hazards.filter((r) => r.assessmentId === asmtHit.id)
    const w = worstResidual(rows)
    const open = actions.filter((r) => r.assessmentId === asmtHit.id && isOpen(r.control)).length
    const where = asmtHit.siteName ? ` at ${asmtHit.siteName}` : ''
    if (!rows.length) return hit(`“${asmtHit.name}”${where} has no hazards recorded yet.`)
    return hit(`“${asmtHit.name}”${where}: ${rows.length} hazard(s), worst residual risk ${w?.label || '—'}, ${open} open action(s). e.g. ${list(rows.map((r) => hzLabel(r.hazard)))}.`)
  }
  if (siteHit) {
    const rows = hazards.filter((r) => norm(r.siteName) === norm(siteHit))
    const hc = rows.filter((r) => isHC(r.residual)).length
    const open = actions.filter((r) => norm(r.siteName) === norm(siteHit) && isOpen(r.control)).length
    if (!rows.length) return hit(`No hazards recorded for ${siteHit} yet.`)
    return hit(`${siteHit}: ${rows.length} hazard(s)${hc ? `, ${hc} at High/Critical residual risk` : ''}, ${open} open action(s).`)
  }

  // ── 2. Scored intent registry ───────────────────────────────────────────────
  const overdue = () => actions.filter((r) => isOverdue(r.control))
  const open = () => actions.filter((r) => isOpen(r.control))

  const INTENTS = [
    {
      // recent activity / audit
      keywords: ['recent', 'history', 'changed', 'lately', 'latest', 'audit', 'who did', 'who changed', 'activity log', ' log'],
      run: () => {
        if (!activity.length) return 'No recorded activity yet. Creating assessments, changing a control’s status or declaring ALARP will show up here.'
        return `Recent activity:\n${activity.slice(0, 5).map((e) => `• ${e.actorName} ${e.message} (${timeAgo(e.at)})`).join('\n')}`
      },
    },
    {
      // overdue
      keywords: ['overdue', 'late', 'past due', 'missed', 'behind', 'due date', 'whats late', 'what is late'],
      run: () => {
        const od = overdue()
        if (!od.length) return 'No overdue actions — nice. An action is overdue when its due date has passed and it isn’t Implemented.'
        return `${od.length} overdue action(s): ${list(od.map((r) => r.control.description || r.control.hierarchy))}. Open the Action Tracker to address them.`
      },
    },
    {
      // priorities / what should I do
      keywords: ['what should i', 'what do i do', 'what next', 'priorit', 'focus', 'urgent', 'most important', 'advice', 'recommend', 'where do i start', 'first', 'attention'],
      run: () => {
        const od = overdue()
        const need = lists.actionRequired
        if (!od.length && !need.length) return 'You’re in good shape — no overdue actions and every residual risk is acceptable or ALARP-accepted.'
        const parts = []
        if (od.length) parts.push(`1) Clear ${od.length} overdue action(s): ${list(od.map((r) => r.control.description || r.control.hierarchy), 2)}.`)
        if (need.length) parts.push(`${od.length ? '2)' : '1)'} Address ${need.length} non-acceptable residual risk(s) (add controls or declare ALARP): ${list(need.map((r) => hzLabel(r.hazard)), 2)}.`)
        return `Here’s where to focus:\n${parts.join('\n')}`
      },
    },
    {
      // open / in-progress actions (CAPA)
      keywords: ['open action', 'open actions', 'in progress', 'pending', 'outstanding', 'unfinished', 'remaining action', 'capa', 'to do', 'todo'],
      run: () => `${open().length} open action(s) (Open or In Progress) out of ${actions.length} additional control(s). ${summary?.overdueActions || 0} are overdue.`,
    },
    {
      keywords: ['critical', 'severe'],
      run: () => lists.critical.length
        ? `${lists.critical.length} hazard(s) at Critical residual risk: ${list(lists.critical.map((x) => hzLabel(x.hazard)))}.`
        : 'No hazards at Critical residual risk.',
    },
    {
      keywords: ['high risk', 'high risks', 'major', ' high'],
      run: () => lists.high.length
        ? `${lists.high.length} hazard(s) at High residual risk: ${list(lists.high.map((x) => hzLabel(x.hazard)))}.`
        : 'No hazards at High residual risk.',
    },
    {
      keywords: ['alarp', 'tolerable', 'as low as'],
      run: () => `${lists.alarp.length} hazard(s) accepted as ALARP. Declare ALARP when a residual risk can’t reasonably be reduced further.`,
    },
    {
      keywords: ['non acceptable', 'not acceptable', 'unacceptable', 'non-acceptable'],
      run: () => `Residual: ${lists.nonAcceptableResidual.length} non-acceptable. Initial: ${lists.nonAcceptableInitial.length} non-acceptable. (Non-acceptable = risk score ≥ 7.) ${lists.actionRequired.length} need action (non-acceptable residual, not yet ALARP).`,
    },
    {
      keywords: ['action required', 'need action', 'needs action', 'require action', 'problem', 'issue', 'concern', 'danger', 'unsafe', 'not safe', 'wrong', 'worry', 'worried'],
      run: () => lists.actionRequired.length
        ? `${lists.actionRequired.length} hazard(s) need action — non-acceptable residual risk and not yet ALARP. See the Action Required tab in the Risk Register.`
        : 'Nothing needs action — all residual risks are acceptable or ALARP-accepted.',
    },
    {
      keywords: ['acceptable'],
      run: () => `Acceptable = risk score 1–6 (Negligible/Low/Medium). Acceptable residual: ${lists.acceptableResidual.length}; non-acceptable residual: ${lists.nonAcceptableResidual.length}.`,
    },
    {
      // how many sites
      keywords: ['how many site', 'number of site', 'sites configured', 'how many facilit'],
      run: () => `${sites.length} site(s) configured${sites.length ? `: ${list(sites, 5)}` : ''}.`,
    },
    {
      // busiest / riskiest site
      keywords: ['which site', 'busiest', 'most hazard', 'site with most', 'riskiest', 'hardest', ' site', 'facility', 'plant', ' where'],
      run: () => {
        const bd = siteBreakdown(assessments)
        if (!bd.length) return 'No hazards recorded yet.'
        return `Busiest site by hazards: ${bd[0][0]} (${bd[0][1]}). ${bd.length > 1 ? `Next: ${bd.slice(1, 3).map(([s, n]) => `${s} (${n})`).join(', ')}.` : ''}`
      },
    },
    {
      keywords: ['activit', 'task', 'operation', ' job'],
      run: () => {
        const top = Object.entries(summary?.byActivity || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
        return top.length ? `Top activities by hazards: ${top.map(([a, n]) => `${a} (${n})`).join(', ')}.` : 'No activities recorded yet.'
      },
    },
    {
      keywords: ['how many assessment', 'assessments', 'total assessment', 'number of assessment', 'show all', 'list all', 'everything', 'show me everything'],
      run: () => `${summary?.totalAssessments || 0} risk assessment(s) with ${summary?.totalHazards || 0} hazard(s) in total.`,
    },
    {
      keywords: ['hazard'],
      run: () => `${summary?.totalHazards || 0} hazard(s) across ${summary?.totalAssessments || 0} assessment(s). ${summary?.permissible || 0} are under permissible risk; ${summary?.highCritical || 0} are High or Critical.`,
    },
    {
      keywords: ['control', 'type of control'],
      run: () => `${summary?.totalControls || 0} control(s) total. Additional controls (CAPA): ${actions.length}, of which ${summary?.openActions || 0} open.`,
    },
    {
      // overall summary / status
      keywords: ['summary', 'overview', 'overall', 'status', 'how are we', 'how is it', 'snapshot', 'brief', 'situation', 'dashboard', 'where do we stand', 'state of', 'risk', 'risks', 'risky', 'how bad', 'is it safe', 'safe', 'how safe'],
      run: () => `Snapshot: ${summary?.totalAssessments || 0} assessment(s), ${summary?.totalHazards || 0} hazard(s) — ${summary?.highCritical || 0} High/Critical, ${lists.alarp.length} ALARP-accepted, ${summary?.permissible || 0} under permissible risk. Actions: ${summary?.openActions || 0} open, ${summary?.overdueActions || 0} overdue. ${lists.actionRequired.length} risk(s) still need action.`,
    },
    {
      keywords: ['help', 'what can you', 'who are you', 'what do you do'],
      tokenKeywords: ['hi', 'hello', 'hey', 'yo'],
      run: () => 'Hi! I read your live data. Ask me for a summary, what’s overdue, your critical/high risks, ALARP count, acceptable vs non-acceptable, the busiest site, recent activity, or “tell me about <an assessment name>”.',
    },
  ]

  let best = null
  let bestScore = 0
  for (const intent of INTENTS) {
    let s = 0
    for (const k of intent.keywords || []) if (qn.includes(k)) s++
    for (const k of intent.tokenKeywords || []) if (tokens.has(k)) s++
    if (s > bestScore) { bestScore = s; best = intent }
  }
  if (best && bestScore > 0) return hit(best.run())

  // ── 3. Unmatched → let the caller try the AI; carry a helpful rule fallback ──
  const qs = suggestedQuestions(pathname)
  return miss(`I’m not certain what you mean. I can tell you about: overdue & open actions, critical/high risks, ALARP, acceptable vs non-acceptable, sites, activities, totals, recent activity — or “tell me about <an assessment>”. Try: “${qs.slice(0, 3).join('”, “')}”.`)
}

/** Convenience for any caller that just wants the answer string. */
export function answerText(question, ctx) {
  return answer(question, ctx).text
}

// ── AI fallback ───────────────────────────────────────────────────────────────
/**
 * Compact, data-only snapshot for the LLM. Only includes the same aggregate
 * figures already visible in the app (no raw control text / member PII).
 */
export function buildAIContext(ctx) {
  const { summary, assessments = [], activity = [], sites = [] } = ctx || {}
  const lists = riskLists(assessments)
  const actions = flattenAdditionalControls(assessments)
  const sitesByHazards = siteBreakdown(assessments).slice(0, 8).map(([site, hazards]) => ({ site, hazards }))
  const topActivities = Object.entries(summary?.byActivity || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([activity, hazards]) => ({ activity, hazards }))
  const recentActivity = activity.slice(0, 8).map((e) => ({ who: e.actorName, did: e.message, when: timeAgo(e.at) }))
  const assessmentList = assessments.slice(0, 40).map((a) => {
    const rows = flattenHazards([a])
    return {
      name: a.name || 'Untitled',
      site: a.siteName || '',
      location: a.location || '',
      hazards: rows.length,
      worstResidual: worstResidual(rows)?.label || null,
    }
  })
  return {
    totals: {
      assessments: summary?.totalAssessments || 0,
      hazards: summary?.totalHazards || 0,
      controls: summary?.totalControls || 0,
      underPermissibleRisk: summary?.permissible || 0,
      highOrCritical: summary?.highCritical || 0,
    },
    risk: {
      alarpAccepted: lists.alarp.length,
      high: lists.high.length,
      critical: lists.critical.length,
      acceptableResidual: lists.acceptableResidual.length,
      nonAcceptableResidual: lists.nonAcceptableResidual.length,
      needsAction: lists.actionRequired.length,
    },
    actions: { total: actions.length, open: summary?.openActions || 0, overdue: summary?.overdueActions || 0 },
    sites,
    sitesByHazards,
    topActivities,
    recentActivity,
    assessments: assessmentList,
  }
}

/**
 * Ask the server-side AI proxy. Returns the answer string, or null on any
 * failure / when the key isn't configured (caller then uses the rule fallback).
 */
export async function askAI(question, context) {
  try {
    const r = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    })
    if (!r.ok) return null
    const d = await r.json().catch(() => null)
    const text = d?.answer ? String(d.answer).trim() : ''
    return text || null
  } catch {
    return null
  }
}
