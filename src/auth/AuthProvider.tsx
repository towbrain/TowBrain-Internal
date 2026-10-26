import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  /** True once the initial session + profile fetch has completed, even if it failed. */
  error: string | null
}

export const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    async function loadProfile(session: Session | null) {
      if (!session) {
        if (active) setState({ session: null, profile: null, loading: false, error: null })
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!active) return
      if (error) {
        setState({ session, profile: null, loading: false, error: error.message })
        return
      }
      setState({ session, profile: data, loading: false, error: null })
    }

    supabase.auth.getSession().then(({ data }) => loadProfile(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, loading: true }))
      loadProfile(session)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}
