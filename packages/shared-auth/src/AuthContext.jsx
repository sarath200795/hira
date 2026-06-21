import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@unified/shared-firebase'
import {
  createOrganization,
  createMember,
  findOrgByName,
  getUserProfile,
} from './identity.js'

const AuthContext = createContext(null)

/**
 * The ONE auth provider for the unified engine, replacing all 7 apps' contexts.
 * Exposes a SUPERSET surface with aliases so ported apps need only swap imports:
 *   user / firebaseUser, isAuthed / isAuthenticated, loading / !authReady,
 *   isApproved, isAdmin, orgId, orgName, profile, profileStatus, isConfigured.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState('loading') // loading|ready|missing|error

  const refreshProfile = useCallback(async (uid) => {
    try {
      const p = await getUserProfile(uid)
      setProfile(p)
      setProfileStatus(p ? 'ready' : 'missing')
      return p
    } catch (e) {
      setProfileStatus('error')
      return null
    }
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await refreshProfile(u.uid)
      } else {
        setProfile(null)
        setProfileStatus('loading')
      }
      setLoading(false)
    })
    return unsub
  }, [refreshProfile])

  // Register a brand-new organization; caller becomes admin. Create the auth
  // user FIRST so the org-name lookup runs authenticated, and roll back the
  // half-created account on failure so the email can be reused.
  const registerOrganization = useCallback(async ({ orgName, address, name, email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    try {
      const existing = await findOrgByName(orgName)
      if (existing) {
        throw new Error('An organization with that name already exists. Try signing up to join it.')
      }
      await updateProfile(cred.user, { displayName: name })
      await createOrganization({ orgName, address, uid: cred.user.uid, name, email })
      await refreshProfile(cred.user.uid)
    } catch (err) {
      await deleteUser(cred.user).catch(() => {})
      throw err
    }
  }, [refreshProfile])

  // Join an existing org. Pending admin approval by default (enterprise default).
  const signUpMember = useCallback(async ({ orgId, orgName, name, email, password }) => {
    if (!orgId) throw new Error('Please select your organization.')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    try {
      await updateProfile(cred.user, { displayName: name })
      await createMember({ uid: cred.user.uid, name, email, orgId, orgName: orgName || '' })
      await refreshProfile(cred.user.uid)
    } catch (err) {
      await deleteUser(cred.user).catch(() => {})
      throw err
    }
  }, [refreshProfile])

  const login = useCallback(async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await refreshProfile(cred.user.uid)
  }, [refreshProfile])

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  const signOut = useCallback(async () => {
    await fbSignOut(auth)
    setProfile(null)
    setProfileStatus('loading')
  }, [])

  const value = useMemo(() => {
    const isApproved = profile?.status === 'approved'
    return {
      // identity
      user,
      firebaseUser: user, // alias (hecp-loto)
      profile,
      profileStatus,
      // status flags + aliases
      loading,
      authReady: !loading, // alias (hecp-loto)
      isConfigured: isFirebaseConfigured, // alias (internal-audit)
      isAuthed: Boolean(user),
      isAuthenticated: Boolean(user), // alias (internal-audit)
      isApproved,
      isAdmin: Boolean(profile?.isAdmin),
      orgId: profile?.orgId || null,
      orgName: profile?.orgName || '',
      // methods
      registerOrganization,
      signUpMember,
      login,
      resetPassword,
      signOut,
      logout: signOut, // alias (hecp-loto/internal-audit)
      refreshProfile: () => (user ? refreshProfile(user.uid) : Promise.resolve(null)),
    }
  }, [user, profile, profileStatus, loading, registerOrganization, signUpMember, login, resetPassword, signOut, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
