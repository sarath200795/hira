import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/data-retention', label: 'Data & Security' },
  { to: '/cookies', label: 'Cookie Policy' },
]

export default function LegalFooter({ tone = 'light', className = '' }) {
  const linkColor =
    tone === 'light'
      ? 'text-slate-500 hover:text-slate-700'
      : 'text-slate-400 hover:text-slate-200'
  const copyColor = tone === 'light' ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={`text-xs ${className}`}>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={`transition ${linkColor}`}>
            {l.label}
          </Link>
        ))}
      </div>
      <p className={`mt-2 ${copyColor}`}>© 2026 WE EHS</p>
    </div>
  )
}
