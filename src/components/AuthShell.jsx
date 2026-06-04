import { motion } from 'framer-motion'
import { ShieldCheck, ClipboardList, BarChart3, AlertTriangle } from 'lucide-react'
import Logo from './Logo'

const FEATURES = [
  { icon: ClipboardList, text: 'Structured hazard identification & risk assessments' },
  { icon: ShieldCheck, text: '5×5 risk matrix with ALARP handling' },
  { icon: BarChart3, text: 'Live risk dashboard across every site & activity' },
]

export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — animated brand panel */}
      <div className="aurora relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Logo size={26} />
          </div>
          <div className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight">HIRA</span>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/60">
              Hazard Identification &amp; Risk Assessment
            </span>
          </div>
        </motion.div>

        <div>
          <motion.h1
            className="max-w-md text-4xl font-black leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Hazard Identification and Risk Assessment
          </motion.h1>
          <motion.p
            className="mt-3 max-w-md text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Identify hazards, score risk on the 5×5 matrix, apply the hierarchy of controls and
            track residual risk to ALARP — across all your activities and sites.
          </motion.p>

          <div className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                className="flex items-center gap-3 rounded-xl glass px-4 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
              >
                <f.icon size={18} className="text-brand-200" />
                <span className="text-sm text-white/90">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute -bottom-10 -right-10 text-[12rem] opacity-20 animate-float"
          aria-hidden
        >
          <AlertTriangle className="text-brand-300" size={220} />
        </motion.div>

        <p className="text-xs text-white/50">© {new Date().getFullYear()} HIRA</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-clay-bg px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-glow">
              <Logo size={20} />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold">HIRA</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Hazard Identification &amp; Risk Assessment
              </span>
            </span>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
