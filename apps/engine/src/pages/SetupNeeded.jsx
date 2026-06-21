import { AlertOctagon } from 'lucide-react'

/** Shown when Firebase env vars are missing (no .env). */
export default function SetupNeeded() {
  return (
    <div className="grid min-h-screen place-items-center bg-clay-bg px-4">
      <div className="max-w-lg rounded-2xl border border-ink-100 bg-white p-8 shadow-card">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600">
          <AlertOctagon size={26} />
        </div>
        <h1 className="text-xl font-bold text-ink-900">Firebase isn't configured</h1>
        <p className="mt-2 text-sm text-ink-600">
          Copy <code className="rounded bg-ink-50 px-1.5 py-0.5">.env.example</code> to{' '}
          <code className="rounded bg-ink-50 px-1.5 py-0.5">apps/engine/.env</code> and fill in your shared
          Firebase project's web config keys, then restart the dev server.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-ink-500 space-y-1">
          <li>VITE_FIREBASE_API_KEY</li>
          <li>VITE_FIREBASE_PROJECT_ID</li>
          <li>… and the rest from Firebase Console → Project settings.</li>
        </ul>
      </div>
    </div>
  )
}
