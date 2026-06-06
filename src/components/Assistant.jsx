import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, Send, Sparkles, Lightbulb } from 'lucide-react'
import { useRa } from '../context/RaContext'
import { useAuth } from '../context/AuthContext'
import { pageGuide, suggestedQuestions, answer } from '../lib/assistant'

const ls = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
}
const loop = (d) => ({ duration: d, repeat: Infinity, ease: 'easeInOut' })

// Palette
const SKIN = '#e8b48f'
const SKIN_D = '#c98b62'
const HAT = '#f4b400'
const HAT_D = '#c98a00'
const VEST = '#2563eb'
const VEST_D = '#1e40af'
const STRIPE = '#fde047'
const TROUSER = '#1e3a8a'
const SHOE = '#0b1220'

// ── Realistic-ish Safety Manager: hard hat + hi-vis vest, two-segment arms.
// Modes: walk · idle · think · scratch · write · wave · search. ───────────────
function Character({ mode = 'idle', reduced = false }) {
  const walking = mode === 'walk'

  const legL = reduced ? { rotate: 0 } : walking ? { rotate: [0, 24, 0, -24, 0] } : { rotate: 0 }
  const legR = reduced ? { rotate: 0 } : walking ? { rotate: [0, -24, 0, 24, 0] } : { rotate: 0 }
  const legT = walking ? loop(0.6) : { duration: 0.3 }

  // Arm joints: uA* = upper arm (shoulder), fA* = forearm (elbow).
  let uAL = { rotate: 0 }, fAL = { rotate: 0 }, uALT = { duration: 0.4 }, fALT = { duration: 0.4 }
  let uAR = { rotate: 0 }, fAR = { rotate: 0 }, uART = { duration: 0.4 }, fART = { duration: 0.4 }
  let head = { rotate: 0 }, headT = { duration: 0.4 }

  if (reduced) {
    if (mode === 'write') { uAL = { rotate: -52 }; fAL = { rotate: -78 }; uAR = { rotate: -44 }; fAR = { rotate: -66 }; head = { rotate: 8 } }
    else if (mode === 'think') { uAR = { rotate: -42 }; fAR = { rotate: -95 }; head = { rotate: -6 } }
  } else if (walking) {
    uAL = { rotate: [0, -18, 0, 18, 0] }; uALT = loop(0.6)
    uAR = { rotate: [0, 18, 0, -18, 0] }; uART = loop(0.6)
  } else if (mode === 'write') {
    uAL = { rotate: -52 }; fAL = { rotate: -78 }
    uAR = { rotate: -44 }; fAR = { rotate: [-62, -72, -62] }; fART = loop(0.5); head = { rotate: 8 }
  } else if (mode === 'think') {
    uAR = { rotate: -42 }; fAR = { rotate: -95 }; head = { rotate: -6 }
  } else if (mode === 'scratch') {
    uAR = { rotate: -150 }; fAR = { rotate: [-34, -52, -34] }; fART = loop(0.4); head = { rotate: -4 }
  } else if (mode === 'wave') {
    uAR = { rotate: -150 }; fAR = { rotate: [-12, 22, -12] }; fART = loop(0.5)
  } else { // idle / search
    uAL = { rotate: [0, 3, 0] }; uALT = loop(3.2)
    uAR = { rotate: [0, -3, 0] }; uART = loop(3.2)
    if (mode === 'search') { uAR = { rotate: -34 }; fAR = { rotate: -34 }; head = { rotate: [-9, 9, -9] }; headT = loop(1.6) }
  }

  const bob = reduced ? { y: 0 } : walking ? { y: [0, -2, 0] } : { y: [0, -1.2, 0] }
  const bobT = walking ? loop(0.6) : loop(2.8)
  const blink = reduced ? undefined : { scaleY: [1, 1, 0.1, 1] }
  const blinkT = reduced ? undefined : { duration: 0.32, times: [0, 0.85, 0.92, 1], repeat: Infinity, repeatDelay: 3 }

  const Arm = ({ shoulder, elbow, upper, fore, uT, fT, side, withPen }) => (
    <motion.g style={{ transformOrigin: `${shoulder[0]}px ${shoulder[1]}px` }} animate={upper} transition={uT}>
      <rect x={shoulder[0] - 2.75} y={shoulder[1]} width="5.5" height={elbow[1] - shoulder[1]} rx="2.7" fill={VEST} stroke={VEST_D} strokeWidth="0.7" />
      <motion.g style={{ transformOrigin: `${elbow[0]}px ${elbow[1]}px` }} animate={fore} transition={fT}>
        <rect x={elbow[0] - 2.75} y={elbow[1]} width="5.5" height="14" rx="2.7" fill={VEST} stroke={VEST_D} strokeWidth="0.7" />
        <circle cx={elbow[0]} cy={elbow[1] + 16} r="3" fill={SKIN} stroke={SKIN_D} strokeWidth="0.6" />
        {withPen && <line x1={elbow[0] + 1} y1={elbow[1] + 14} x2={elbow[0] + 4} y2={elbow[1] + 19} stroke="#0b1220" strokeWidth="1.6" strokeLinecap="round" />}
      </motion.g>
    </motion.g>
  )

  return (
    <svg width="62" height="116" viewBox="0 0 64 120" fill="none" aria-hidden="true">
      <motion.g animate={bob} transition={bobT}>
        {/* legs */}
        <motion.g style={{ transformOrigin: '28px 74px' }} animate={legL} transition={legT}>
          <rect x="24.5" y="74" width="6.5" height="32" rx="2.4" fill={TROUSER} />
          <rect x="22.5" y="104" width="11" height="6.5" rx="3" fill={SHOE} />
        </motion.g>
        <motion.g style={{ transformOrigin: '36px 74px' }} animate={legR} transition={legT}>
          <rect x="33" y="74" width="6.5" height="32" rx="2.4" fill="#172e6b" />
          <rect x="30.5" y="104" width="11" height="6.5" rx="3" fill={SHOE} />
        </motion.g>

        {/* torso: shirt + hi-vis vest */}
        <rect x="22" y="33" width="20" height="42" rx="6" fill="#e7eef8" />
        <path d="M22 40v-1a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1z" fill="#e7eef8" />
        <path d="M23 41h7l2 5 2-5h7v33a3 3 0 0 1-3 3H26a3 3 0 0 1-3-3z" fill={VEST} stroke={VEST_D} strokeWidth="0.8" />
        <rect x="25" y="58" width="14" height="2.6" fill={STRIPE} />
        <rect x="27.5" y="44" width="2.4" height="31" fill={STRIPE} />
        <rect x="34.1" y="44" width="2.4" height="31" fill={STRIPE} />

        {/* neck */}
        <rect x="29" y="29" width="6" height="6" fill={SKIN} />

        {/* left arm */}
        <Arm shoulder={[24, 39]} elbow={[24, 54]} upper={uAL} fore={fAL} uT={uALT} fT={fALT} side="L" />

        {/* clipboard while writing */}
        {mode === 'write' && (
          <g transform="rotate(-8 33 60)">
            <rect x="24" y="50" width="19" height="24" rx="2" fill="#c8d2e0" stroke="#94a3b8" strokeWidth="0.8" />
            <rect x="26" y="53" width="15" height="19" rx="1" fill="#fff" />
            <rect x="30" y="48.5" width="7" height="3" rx="1" fill="#94a3b8" />
            <rect x="28" y="57" width="11" height="1.2" rx="0.6" fill="#cbd5e1" />
            <rect x="28" y="61" width="11" height="1.2" rx="0.6" fill="#cbd5e1" />
            <rect x="28" y="65" width="8" height="1.2" rx="0.6" fill="#cbd5e1" />
          </g>
        )}

        {/* right arm (pen while writing) */}
        <Arm shoulder={[40, 39]} elbow={[40, 54]} upper={uAR} fore={fAR} uT={uART} fT={fART} side="R" withPen={mode === 'write'} />

        {/* head */}
        <motion.g style={{ transformOrigin: '32px 31px' }} animate={head} transition={headT}>
          <circle cx="23.5" cy="23" r="2" fill={SKIN} stroke={SKIN_D} strokeWidth="0.5" />
          <circle cx="40.5" cy="23" r="2" fill={SKIN} stroke={SKIN_D} strokeWidth="0.5" />
          <circle cx="32" cy="22" r="9.2" fill={SKIN} stroke={SKIN_D} strokeWidth="0.6" />
          {/* hair sideburns */}
          <path d="M23.5 20c0-3 2-5 4-5l-1 6z" fill="#4a3526" />
          <path d="M40.5 20c0-3-2-5-4-5l1 6z" fill="#4a3526" />
          {/* eyes */}
          <motion.g style={{ transformOrigin: '32px 22px' }} animate={blink} transition={blinkT}>
            <circle cx="28.6" cy="22" r="1.5" fill="#fff" /><circle cx="29" cy="22.2" r="0.9" fill="#1f2937" />
            <circle cx="35.4" cy="22" r="1.5" fill="#fff" /><circle cx="35.8" cy="22.2" r="0.9" fill="#1f2937" />
          </motion.g>
          {/* brows + smile */}
          <path d="M27 18.6c1-0.6 2.4-0.6 3.4 0" stroke="#4a3526" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M34 18.6c1-0.6 2.4-0.6 3.4 0" stroke="#4a3526" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M29 26.5c1.6 1.4 4.4 1.4 6 0" stroke={SKIN_D} strokeWidth="0.9" strokeLinecap="round" fill="none" />
          {/* hard hat */}
          <path d="M21 17a11 9.5 0 0 1 22 0z" fill={HAT} />
          <rect x="19" y="15.6" width="26" height="2.8" rx="1.4" fill={HAT_D} />
          <rect x="31" y="8.6" width="2" height="7" fill={HAT_D} />
        </motion.g>

        {/* thought dots */}
        {mode === 'think' && !reduced && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0.2, 1, 0.2] }} transition={loop(1.4)}>
            <circle cx="46" cy="16" r="1.4" fill="#94a3b8" />
            <circle cx="50" cy="11" r="2" fill="#94a3b8" />
            <circle cx="54" cy="6" r="2.6" fill="#94a3b8" />
          </motion.g>
        )}
      </motion.g>
    </svg>
  )
}

function Bubble({ from, children }) {
  const mine = from === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-clay-100 text-ink-800'}`}>
        {children}
      </div>
    </div>
  )
}

export default function Assistant() {
  const location = useLocation()
  const { summary, assessments, activity, sites } = useRa()
  const { user } = useAuth()
  const reduced = useReducedMotion()
  const uid = user?.uid || 'anon'

  const [open, setOpen] = useState(false)
  const [tip, setTip] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  const [mode, setMode] = useState('idle')
  const [x, setX] = useState(80)
  const [walkDur, setWalkDur] = useState(1.4)
  const [facing, setFacing] = useState(-1)
  const xRef = useRef(80)
  const pausedRef = useRef(false)

  const guide = useMemo(() => pageGuide(location.pathname), [location.pathname])
  const chips = useMemo(() => suggestedQuestions(location.pathname), [location.pathname])
  const overdue = summary?.overdueActions || 0
  const ctx = { summary, assessments, activity, sites, pathname: location.pathname }
  const writingPage = location.pathname.includes('/create')
  const homeX = () => Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 96)

  // Stationary (not wandering) when greeting, tip showing, writing, or reduced.
  const stationary = open || !!tip || reduced || writingPage
  useEffect(() => { pausedRef.current = stationary }, [stationary])

  useEffect(() => {
    if (open) { const hx = homeX(); setX(hx); xRef.current = hx; setWalkDur(0.7); setFacing(-1); setMode('wave'); return undefined }
    if (tip) { const hx = homeX(); setX(hx); xRef.current = hx; setWalkDur(0.7); setFacing(-1); setMode('idle'); return undefined }
    if (writingPage) { setX(46); xRef.current = 46; setWalkDur(0.7); setFacing(1); setMode('write'); return undefined }
    if (reduced) { const hx = homeX(); setX(hx); xRef.current = hx; setFacing(-1); setMode('idle'); return undefined }
    // wander
    let alive = true
    let t
    const rand = (a, b) => a + Math.random() * (b - a)
    const step = () => {
      if (!alive || pausedRef.current) return
      const from = xRef.current
      const maxX = Math.max(90, (window.innerWidth || 1000) - 120)
      const target = Math.round(rand(20, maxX))
      const dur = Math.min(6, Math.max(1.2, Math.abs(target - from) / 110))
      setFacing(target >= from ? 1 : -1)
      setWalkDur(dur); setMode('walk'); setX(target); xRef.current = target
      t = setTimeout(() => {
        if (!alive || pausedRef.current) return
        setMode(['idle', 'search', 'think', 'scratch', 'wave'][Math.floor(Math.random() * 5)])
        t = setTimeout(step, rand(3200, 6000))
      }, dur * 1000 + 150)
    }
    t = setTimeout(step, 1400)
    return () => { alive = false; clearTimeout(t) }
  }, [open, tip, writingPage, reduced])

  useEffect(() => {
    if (open) return undefined
    const welcomed = ls.get(`hira:guide:welcomed:${uid}`) === '1'
    if (!welcomed) {
      const t = setTimeout(() => setTip({ welcome: true, title: 'Hi, I’m Sam — your Safety Guide 👷', text: 'I’ll walk you through the app and answer questions about your risks. Tap me anytime.' }), 1400)
      return () => clearTimeout(t)
    }
    const seenKey = `hira:guide:tip:${uid}:${guide.title}`
    if (ls.get(seenKey) !== '1') {
      const t = setTimeout(() => setTip({ title: guide.title, text: guide.tips[0] }), 900)
      return () => clearTimeout(t)
    }
    return undefined
  }, [location.pathname, open, uid, guide])

  const dismissTip = () => {
    if (tip?.welcome) ls.set(`hira:guide:welcomed:${uid}`, '1')
    else if (tip) ls.set(`hira:guide:tip:${uid}:${guide.title}`, '1')
    setTip(null)
  }
  const openPanel = () => {
    if (tip?.welcome) ls.set(`hira:guide:welcomed:${uid}`, '1')
    if (tip) ls.set(`hira:guide:tip:${uid}:${guide.title}`, '1')
    setTip(null); setOpen(true)
  }
  const ask = (text) => {
    const t = (text || '').trim()
    if (!t) return
    setMessages((m) => [...m, { from: 'user', text: t }, { from: 'guide', text: answer(t, ctx) }])
    setInput('')
  }
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  return (
    <div className="no-print">
      {/* Walking character */}
      <motion.div className="fixed bottom-1 left-0 z-40" animate={{ x }} transition={{ duration: walkDur, ease: 'linear' }}>
        <button onClick={() => (open ? setOpen(false) : openPanel())} className="relative block" aria-label="Open Safety Guide">
          <div style={{ transform: `scaleX(${facing})` }}>
            <Character mode={open ? 'wave' : mode} reduced={reduced} />
          </div>
          {overdue > 0 && (
            <span className="absolute right-0 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
              {overdue}
            </span>
          )}
        </button>
      </motion.div>

      {/* Tip / welcome bubble */}
      <AnimatePresence>
        {tip && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-28 right-5 z-40 w-64 rounded-2xl border border-clay-200 bg-clay-surface p-3.5 shadow-card"
          >
            <button onClick={dismissTip} className="absolute right-2 top-2 rounded-lg p-1 text-ink-400 hover:bg-clay-100"><X size={14} /></button>
            <p className="pr-4 text-sm font-bold text-ink-900">{tip.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">{tip.text}</p>
            <button onClick={openPanel} className="btn-soft mt-2.5 px-3 py-1.5 text-xs">
              <Sparkles size={13} /> {tip.welcome ? 'Show me around' : 'Ask Sam'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistant panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-32 right-5 z-50 flex max-h-[68vh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-clay-200 bg-clay-surface shadow-card"
          >
            <div className="flex items-center gap-2.5 border-b border-clay-200 bg-brand-600 px-4 py-3 text-white">
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white/15"><Character mode="idle" reduced /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Sam — Safety Guide</p>
                <p className="text-[11px] text-white/70">Insights from your live data</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/80 hover:bg-white/15"><X size={16} /></button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <Lightbulb size={13} /> {guide.title}
                </p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-600">
                  {guide.tips.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </div>
              {overdue > 0 && <Bubble from="guide">⚠️ You have {overdue} overdue action(s). Ask me “what’s overdue?” or open the Action Tracker.</Bubble>}
              {messages.map((m, i) => <Bubble key={i} from={m.from}>{m.text}</Bubble>)}
            </div>

            <div className="flex flex-wrap gap-1.5 border-t border-clay-200 px-3 pt-2.5">
              {chips.map((c) => (
                <button key={c} onClick={() => ask(c)} className="chip bg-clay-100 text-ink-600 hover:bg-clay-200">{c}</button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="flex items-center gap-2 p-3">
              <input className="input py-2" placeholder="Ask about your risks…" value={input} onChange={(e) => setInput(e.target.value)} />
              <button type="submit" className="btn-primary px-3 py-2" disabled={!input.trim()}><Send size={16} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
