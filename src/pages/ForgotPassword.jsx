import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '../components/AuthShell'
import { Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { authErrorMessage } from '../lib/authErrors'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Reset link sent — check your inbox.')
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={26} />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">Check your email</h2>
        <p className="mt-1 text-sm text-ink-500">
          If an account exists for <span className="font-semibold text-ink-700">{email}</span>, we've
          sent a link to reset your password. The link expires after a short while, so use it soon.
        </p>

        <button
          type="button"
          className="btn-ghost mt-8 w-full"
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink-900">Forgot password?</h2>
      <p className="mt-1 text-sm text-ink-500">
        Enter the email tied to your account and we'll send you a link to reset your password.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              required
              autoComplete="email"
              className="input pl-9"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : (<>Send reset link <ArrowRight size={16} /></>)}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
