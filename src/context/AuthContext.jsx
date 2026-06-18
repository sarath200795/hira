import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'
import {
  createOrganization,
  createMember,
  findOrgByName,
  getUserProfile,
} from '../lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // firebase auth user
  const [profile, setProfile] = useState(null) // users/{uid} doc
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async (uid) => {
    const p = await getUserProfile(uid)
    setProfile(p)
    return p
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
      }
      setLoading(false)
    })
    return unsub
  }, [refreshProfile])

  // Register a brand new organization; caller becomes admin.
  // Create the auth user FIRST so the org-name lookup runs authenticated.
  const registerOrganization = async ({ orgName, address, name, email, password }) => {
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
      // Roll back the half-created account so the email can be reused.
      await deleteUser(cred.user).catch(() => {})
      throw err
    }
  }

  // Sign up to join an existing org. Auto-approved (no admin queue).
  const signUpMember = async ({ orgId, orgName, name, email, password }) => {
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
  }

  const login = async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await refreshProfile(cred.user.uid)
  }

  // Send a password-reset email. The user follows the link in the email to
  // choose a new password (handled by Firebase's hosted reset flow).
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email)
  }

  const signOut = async () => {
    await fbSignOut(auth)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    isAuthed: Boolean(user),
    isAdmin: profile?.role === 'admin',
    orgId: profile?.orgId || null,
    orgName: profile?.orgName || '',
    registerOrganization,
    signUpMember,
    login,
    resetPassword,
    signOut,
    refreshProfile: () => user && refreshProfile(user.uid),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
