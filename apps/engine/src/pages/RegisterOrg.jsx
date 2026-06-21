import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@unified/shared-auth'
import AuthShell, { Field, SubmitButton } from './AuthShell.jsx'

export default function RegisterOrg() {
  const { registerOrganization } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ orgName: '', address: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await registerOrganization(form)
      toast.success('Organization created!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err?.message || 'Could not create organization.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your organization"
      subtitle="You'll become the first administrator"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Organization name" value={form.orgName} onChange={set('orgName')} required />
        <Field label="Address (optional)" value={form.address} onChange={set('address')} />
        <Field label="Your name" value={form.name} onChange={set('name')} required />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" minLength={6} />
        <SubmitButton loading={loading}>Create organization</SubmitButton>
      </form>
    </AuthShell>
  )
}
