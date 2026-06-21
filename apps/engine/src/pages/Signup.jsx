import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth, listOrganizations } from '@unified/shared-auth'
import AuthShell, { Field, SubmitButton } from './AuthShell.jsx'

export default function Signup() {
  const { signUpMember } = useAuth()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [form, setForm] = useState({ orgId: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    listOrganizations().then(setOrgs).catch(() => setOrgs([]))
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const org = orgs.find((o) => o.id === form.orgId)
      await signUpMember({ ...form, orgName: org?.name || '' })
      toast.success('Account created — awaiting approval.')
      navigate('/pending', { replace: true })
    } catch (err) {
      toast.error(err?.message || 'Could not sign up.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Join your organization"
      subtitle="Request access to your team's HSE apps"
      footer={
        <>
          Setting up a new company?{' '}
          <Link to="/register-org" className="font-medium text-brand-700 hover:underline">
            Create an organization
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Organization</span>
          <select
            value={form.orgId}
            onChange={set('orgId')}
            required
            className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select your organization…</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </label>
        <Field label="Your name" value={form.name} onChange={set('name')} required />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" minLength={6} />
        <SubmitButton loading={loading}>Request access</SubmitButton>
      </form>
    </AuthShell>
  )
}
