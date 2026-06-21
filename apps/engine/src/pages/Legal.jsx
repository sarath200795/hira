import { Link } from 'react-router-dom'

const TITLES = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  retention: 'Data Retention',
  cookies: 'Cookie Policy',
}

/** Placeholder legal pages — engine owns these routes for every app. */
export default function Legal({ kind }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/login" className="text-sm text-brand-700 hover:underline">← Back</Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">{TITLES[kind] || 'Legal'}</h1>
      <p className="mt-3 text-ink-600">
        This is a placeholder for the unified engine's {TITLES[kind]?.toLowerCase() || 'legal'} content.
        The consolidated policy will be migrated here from the individual apps.
      </p>
    </div>
  )
}
