import { Link } from 'react-router-dom'
import { ArrowLeft, Hammer } from 'lucide-react'

/** Shown for apps that aren't ported yet (and for the Training "coming soon" tile). */
export default function AppPlaceholder({ mod }) {
  const Icon = mod.icon || Hammer
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl text-white"
          style={{ backgroundColor: mod.color || '#475569' }}
        >
          <Icon size={30} />
        </div>
        <h1 className="text-2xl font-bold text-ink-900">{mod.title}</h1>
        <p className="mt-1 text-ink-500">{mod.description}</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
          <Hammer size={15} /> Coming soon — not yet integrated
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
