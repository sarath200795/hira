import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAuth } from '@unified/shared-auth'

export default function Pending() {
  const { profile, signOut, isApproved } = useAuth()
  const navigate = useNavigate()

  if (isApproved) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="grid min-h-screen place-items-center bg-clay-bg px-4">
      <div className="max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock size={28} />
        </div>
        <h1 className="text-xl font-bold text-ink-900">Awaiting approval</h1>
        <p className="mt-2 text-sm text-ink-500">
          Your request to join <span className="font-medium">{profile?.orgName || 'your organization'}</span> is
          pending an administrator's approval. You'll get access as soon as it's granted.
        </p>
        <button
          onClick={async () => {
            await signOut()
            navigate('/login', { replace: true })
          }}
          className="mt-6 rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
