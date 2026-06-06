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

// ── The mascot: blue shield body, blinking eyes, a yellow magnifier ──────────
function Mascot({ size = 44, reduced = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 45s16-8 16-21V10l-16-6-16 6v14c0 13 16 21 16 21z" fill="#2563eb" />
      <path d="M24 45s16-8 16-21V10l-16-6-16 6v14c0 13 16 21 16 21z" stroke="#1e40af" strokeWidth="1.2" />
      {/* eyes (blink) */}
      <motion.g
        style={{ transformOrigin: '24px 21px' }}
        animate={reduced ? undefined : { scaleY: [1, 1, 0.1, 1] }}
        transition={reduced ? undefined : { duration: 0.32, times: [0, 0.85, 0.92, 1], repeat: Infinity, repeatDelay: 3.2 }}
      >
        <circle cx="19" cy="21" r="3.1" fill="#fff" />
        <circle cx="29" cy="21" r="3.1" fill="#fff" />
        <circle cx="19.7" cy="21.4" r="1.5" fill="#0b1220" />
        <circle cx="29.7" cy="21.4" r="1.5" fill="#0b1220" />
      </motion.g>
      {/* smile */}
      <path d="M20 27c1.4 1.5 6.6 1.5 8 0" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      {/* magnifier */}
      <circle cx="34" cy="31" r="4.4" fill="rgba(234,179,8,0.25)" stroke="#eab308" strokeWidth="2" />
      <path d="M37.4 34.4 41 38" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function Bubble({ from, children }) {
  const mine = from === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
          mine ? 'bg-brand-600 text-white' : 'bg-clay-100 text-ink-800'
        }`}
      >
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
  const [tip, setTip] = useState(null) // auto tip bubble { title, text, welcome }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  const guide = useMemo(() => pageGuide(location.pathname), [location.pathname])
  const chips = useMemo(() => suggestedQuestions(location.pathname), [location.pathname])
  const overdue = summary?.overdueActions || 0
  const ctx = { summary, assessments, activity, sites, pathname: location.pathname }

  // Welcome (first ever) or per-page tip (first visit) → little auto bubble.
  useEffect(() => {
    if (open) return undefined
    const welcomed = ls.get(`hira:guide:welcomed:${uid}`) === '1'
    if (!welcomed) {
      const t = setTimeout(() => setTip({ welcome: true, title: 'Hi, I’m your HIRA Guide 👋', text: 'I can show you around and answer questions about your risks. Tap me anytime.' }), 1200)
      return () => clearTimeout(t)
    }
    const seenKey = `hira:guide:tip:${uid}:${guide.title}`
    if (ls.get(seenKey) !== '1') {
      const t = setTimeout(() => setTip({ title: guide.title, text: guide.tips[0] }), 800)
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
      {/* Auto tip / welcome bubble */}
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
              <Sparkles size={13} /> {tip.welcome ? 'Show me around' : 'Ask the Guide'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating mascot button */}
      <motion.button
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-white shadow-card ring-1 ring-clay-200 transition-shadow hover:shadow-glow"
        animate={reduced ? undefined : { y: [0, -5, 0] }}
        transition={reduced ? undefined : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open HIRA Guide"
      >
        <Mascot size={42} reduced={reduced} />
        {overdue > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
            {overdue}
          </span>
        )}
      </motion.button>

      {/* Assistant panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-24 right-5 z-50 flex max-h-[72vh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-clay-200 bg-clay-surface shadow-card"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-clay-200 bg-brand-600 px-4 py-3 text-white">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15"><Mascot size={26} reduced /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">HIRA Guide</p>
                <p className="text-[11px] text-white/70">Insights from your live data</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/80 hover:bg-white/15"><X size={16} /></button>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {/* Page guide */}
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <Lightbulb size={13} /> {guide.title}
                </p>
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-600">
                  {guide.tips.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </div>

              {overdue > 0 && (
                <Bubble from="guide">⚠️ You have {overdue} overdue action(s). Ask me “what’s overdue?” or open the Action Tracker.</Bubble>
              )}

              {messages.map((m, i) => <Bubble key={i} from={m.from}>{m.text}</Bubble>)}
            </div>

            {/* Suggested chips */}
            <div className="flex flex-wrap gap-1.5 border-t border-clay-200 px-3 pt-2.5">
              {chips.map((c) => (
                <button key={c} onClick={() => ask(c)} className="chip bg-clay-100 text-ink-600 hover:bg-clay-200">{c}</button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); ask(input) }}
              className="flex items-center gap-2 p-3"
            >
              <input
                className="input py-2"
                placeholder="Ask about your risks…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="btn-primary px-3 py-2" disabled={!input.trim()}><Send size={16} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
