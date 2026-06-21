import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '@unified/shared-auth'
import PageHeader from '../../components/PageHeader'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge, { labelize } from '../../components/ui/Badge'
import { updateOwnName, changeOwnPassword } from '../../services/users'
import { friendlyAuthError } from '../../lib/authErrors'

export default function Profile() {
  const { firebaseUser, profile, org, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(profile?.name || '')
  const [nameSaved, setNameSaved] = useState(false)
  const [savingName, setSavingName] = useState(false)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState(null) // {type, text}
  const [savingPw, setSavingPw] = useState(false)

  const saveName = async (e) => {
    e.preventDefault()
    setSavingName(true)
    setNameSaved(false)
    try {
      await updateOwnName(firebaseUser.uid, name)
      setNameSaved(true)
    } finally {
      setSavingName(false)
    }
  }

  const savePw = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pw.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (pw !== pw2) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setSavingPw(true)
    try {
      await changeOwnPassword(pw)
      setPwMsg({ type: 'success', text: 'Password updated.' })
      setPw('')
      setPw2('')
    } catch (err) {
      setPwMsg({ type: 'error', text: friendlyAuthError(err) })
    } finally {
      setSavingPw(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account and security." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Account */}
          <Card>
            <CardHeader title="Account" />
            <form onSubmit={saveName} className="space-y-4">
              <Input
                label="Full name"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input label="Email" icon={Mail} value={profile?.email || ''} disabled />
              {nameSaved && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  Profile updated.
                </p>
              )}
              <Button type="submit" loading={savingName}>
                Save changes
              </Button>
            </form>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader title="Change password" />
            <form onSubmit={savePw} className="space-y-4">
              <Input
                label="New password"
                type="password"
                icon={Lock}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <Input
                label="Confirm new password"
                type="password"
                icon={Lock}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
              />
              {pwMsg && (
                <p
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    pwMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {pwMsg.text}
                </p>
              )}
              <Button type="submit" variant="secondary" loading={savingPw}>
                Update password
              </Button>
            </form>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Membership" />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Organization</dt>
                <dd className="font-medium text-ink-800">{org?.name || '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Role</dt>
                <dd>
                  <Badge tone={profile?.role === 'admin' ? 'brand' : 'slate'}>
                    {profile?.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                    {labelize(profile?.role || '')}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <Badge tone="green">{labelize(profile?.status || '')}</Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <Button variant="danger" icon={LogOut} onClick={handleLogout} className="w-full">
              Sign out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
