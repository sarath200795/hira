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
const REPEAT = (duration) => ({ duration, repeat: Infinity, ease: 'easeInOut' })

// ── Full-body Scout Bot: hard hat + hi-vis vest, with rigged limbs that
// walk / idle / think / search / wave. Joints are <g> groups rotated by mode. ──
function Character({ mode = 'idle', reduced = false }) {
  const walking = mode === 'walk'

  const legL = reduced ? { rotate: 0 } : walking ? { rotate: [0, 26, 0, -26, 0] } : { rotate: 0 }
  const legR = reduced ? { rotate: 0 } : walking ? { rotate: [0, -26, 0, 26, 0] } : { rotate: 0 }
  const legT = walking ? REPEAT(0.6) : { duration: 0.3 }

  const armL = reduced ? { rotate: 0 } : walking ? { rotate: [0, -22, 0, 22, 0] } : { rotate: [0, 5, 0] }
  const armLT = walking ? REPEAT(0.6) : REPEAT(3)

  let armR = { rotate: 0 }
  let armRT = { duration: 0.4 }
  if (reduced) { armR = { rotate: mode === 'think' ? -110 : mode === 'search' ? -38 : 0 } }
  else if (walking) { armR = { rotate: [0, 22, 0, -22, 0] }; armRT = REPEAT(0.6) }
  else if (mode === 'think') { armR = { rotate: -114 } }
  else if (mode === 'search') { armR = { rotate: -40 } }
  else if (mode === 'wave') { armR = { rotate: [-150, -120, -150] }; armRT = REPEAT(0.55) }
  else { armR = { rotate: [0, -5, 0] }; armRT = REPEAT(3) }

  const head = reduced ? { rotate: 0 } : mode === 'think' ? { rotate: -7 } : mode === 'search' ? { rotate: [-9, 9, -9] } : { rotate: 0 }
  const headT = mode === 'search' ? REPEAT(1.6) : { duration: 0.4 }

  const bob = reduced ? { y: 0 } : walking ? { y: [0, -2, 0] } : { y: [0, -1.5, 0] }
  const bobT = walking ? REPEAT(0.6) : REPEAT(2.8)

  const blink = reduced ? undefined : { scaleY: [1, 1, 0.1, 1] }
  const blinkT = reduced ? undefined : { duration: 0.32, times: [0, 0.85, 0.92, 1], repeat: Infinity, repeatDelay: 3 }

  return (
    <svg width="64" height="104" viewBox="0 0 56 108" fill="none" aria-hidden="true">
      <motion.g animate={bob} transition={bobT}>
        {/* legs */}
        <motion.g style={{ transformOrigin: '24px 66px' }} animate={legL} transition={legT}>
          <rect x="21" y="66" width="6.5" height="27" rx="3.2" fill="#1e40af" />
          <rect x="19.5" y="91" width="10" height="6" rx="3" fill="#0b1220" />
        </motion.g>
        <motion.g style={{ transformOrigin: '32px 66px' }} animate={legR} transition={legT}>
          <rect x="28.5" y="66" width="6.5" height="27" rx="3.2" fill="#1d4ed8" />
          <rect x="26.5" y="91" width="10" height="6" rx="3" fill="#0b1220" />
        </motion.g>

        {/* torso / blue hi-vis vest */}
        <path d="M15 66v-22a8 8 0 0 1 8-8h10a8 8 0 0 1 8 8v22z" fill="#2563eb" stroke="#1e40af" strokeWidth="1" />
        <path d="M24 36 28 41 32 36z" fill="#1e3a8a" />
        <rect x="16.5" y="52" width="23" height="2.6" fill="#fde047" />
        <rect x="22" y="42" width="2.4" height="24" fill="#fde047" />
        <rect x="31.6" y="42" width="2.4" height="24" fill="#fde047" />

        {/* left arm */}
        <motion.g style={{ transformOrigin: '19px 40px' }} animate={armL} transition={armLT}>
          <rect x="15.5" y="40" width="5.5" height="22" rx="2.7" fill="#2563eb" stroke="#1e40af" strokeWidth="0.8" />
          <circle cx="18.2" cy="62" r="3" fill="#1d4ed8" />
        </motion.g>

        {/* right arm (holds the magnifier) */}
        <motion.g style={{ transformOrigin: '37px 40px' }} animate={armR} transition={armRT}>
          <rect x="35" y="40" width="5.5" height="22" rx="2.7" fill="#2563eb" stroke="#1e40af" strokeWidth="0.8" />
          <circle cx="37.8" cy="62" r="3" fill="#1d4ed8" />
          <circle cx="37.8" cy="68" r="4" fill="rgba(234,179,8,0.25)" stroke="#eab308" strokeWidth="2" />
          <path d="M40.6 70.8 44 74" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
        </motion.g>

        {/* head: antenna, hard hat, visor, eyes */}
        <motion.g style={{ transformOrigin: '28px 30px' }} animate={head} transition={headT}>
          <circle cx="28" cy="8" r="1.6" fill="#eab308" />
          <line x1="28" y1="9.2" x2="28" y2="12.5" stroke="#1e40af" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M16 22a12 10 0 0 1 24 0z" fill="#eab308" />
          <rect x="14" y="20.6" width="28" height="2.8" rx="1.4" fill="#ca8a04" />
          <rect x="18" y="22" width="20" height="14" rx="5.5" fill="#2563eb" stroke="#1e40af" strokeWidth="1" />
          <rect x="21" y="25.5" width="14" height="7" rx="3.5" fill="#0b1220" />
          <motion.g style={{ transformOrigin: '28px 29px' }} animate={blink} transition={blinkT}>
            <circle cx="25" cy="29" r="1.9" fill="#60a5fa" />
            <circle cx="31" cy="29" r="1.9" fill="#eab308" />
          </motion.g>
        </motion.g>

        {/* thought dots */}
        {mode === 'think' && !reduced && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0.2, 1, 0.2] }} transition={REPEAT(1.4)}>
            <circle cx="42" cy="18" r="1.4" fill="#94a3b8" />
            <circle cx="46" cy="13" r="2" fill="#94a3b8" />
            <circle cx="50" cy="8" r="2.6" fill="#94a3b8" />
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

  // Walking character state
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
  const homeX = () => Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 96)

  // Paused (docked at corner) when greeting, showing a tip, or reduced motion.
  const paused = open || !!tip || reduced
  useEffect(() => { pausedRef.current = paused }, [paused])

  // Wander loop: walk to a random spot, then do an activity, repeat. When paused,
  // dock to the bottom-right corner beside the tip/panel and face inward.
  useEffect(() => {
    if (paused) {
      const hx = homeX()
      setX(hx); xRef.current = hx; setWalkDur(0.7); setFacing(-1)
      setMode(open ? 'wave' : 'idle')
      return undefined
    }
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
      setWalkDur(dur)
      setMode('walk')
      setX(target); xRef.current = target
      t = setTimeout(() => {
        if (!alive || pausedRef.current) return
        setMode(['idle', 'search', 'think', 'idle', 'wave'][Math.floor(Math.random() * 5)])
        t = setTimeout(step, rand(3200, 6000))
      }, dur * 1000 + 150)
    }
    t = setTimeout(step, 1400)
    return () => { alive = false; clearTimeout(t) }
  }, [paused, open])

  // Welcome (first ever) or per-page tip (first visit).
  useEffect(() => {
    if (open) return undefined
    const welcomed = ls.get(`hira:guide:welcomed:${uid}`) === '1'
    if (!welcomed) {
      const t = setTimeout(() => setTip({ welcome: true, title: 'Hi, I’m Scout — your HIRA Guide 👷', text: 'I’ll walk you through the app and answer questions about your risks. Tap me anytime.' }), 1400)
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
    setTip(null)
    setOpen(true)
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
      <motion.div
        className="fixed bottom-1 left-0 z-40"
        animate={{ x }}
        transition={{ duration: walkDur, ease: 'linear' }}
      >
        <button onClick={() => (open ? setOpen(false) : openPanel())} className="relative block" aria-label="Open HIRA Guide">
          <div style={{ transform: `scaleX(${facing})` }}>
            <Character mode={open ? 'wave' : mode} reduced={reduced} />
          </div>
          {overdue > 0 && (
            <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
              {overdue}
            </span>
          )}
        </button>
      </motion.div>

      {/* Auto tip / welcome bubble (docked bottom-right beside the character) */}
      <AnimatePresence>
        {tip && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-24 right-5 z-40 w-64 rounded-2xl border border-clay-200 bg-clay-surface p-3.5 shadow-card"
          >
            <button onClick={dismissTip} className="absolute right-2 top-2 rounded-lg p-1 text-ink-400 hover:bg-clay-100"><X size={14} /></button>
            <p className="pr-4 text-sm font-bold text-ink-900">{tip.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">{tip.text}</p>
            <button onClick={openPanel} className="btn-soft mt-2.5 px-3 py-1.5 text-xs">
              <Sparkles size={13} /> {tip.welcome ? 'Show me around' : 'Ask Scout'}
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
            className="fixed bottom-28 right-5 z-50 flex max-h-[70vh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-clay-200 bg-clay-surface shadow-card"
          >
            <div className="flex items-center gap-2.5 border-b border-clay-200 bg-brand-600 px-4 py-3 text-white">
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white/15"><Character mode="idle" reduced /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Scout — HIRA Guide</p>
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
