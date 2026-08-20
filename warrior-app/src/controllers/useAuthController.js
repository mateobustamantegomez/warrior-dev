import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient.js'
import { translateAuthError } from '../models/AuthErrorModel.js'

/**
 * useAuthController
 * ------------------
 * CONTROLLER layer. Owns authentication state via Supabase Auth — real
 * email/password accounts plus anonymous auth for guest mode (see
 * REQUIREMENTS.md section 0.1). Listens for auth state changes so a
 * session restored on page load is picked up without extra plumbing.
 */
export function useAuthController() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function continueAsGuest() {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) return { ok: false, message: translateAuthError(error.message) }
    return { ok: true }
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { ok: false, message: translateAuthError(error.message) }
    return { ok: true }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, message: translateAuthError(error.message) }
    return { ok: true }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return {
    auth: {
      isAuthenticated: !!session,
      userId: session?.user?.id ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
    },
    authLoading: loading,
    continueAsGuest,
    signUp,
    signIn,
    logout,
  }
}
