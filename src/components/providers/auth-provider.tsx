'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { User, Session } from '@supabase/supabase-js'
import { appLogger } from '@/lib/logger'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Get initial session
    const getInitialSession = async () => {
      try {
        if (!supabase) {
          appLogger.warn('Supabase not initialized, skipping auth setup', { component: 'AuthProvider' })
          setLoading(false)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          appLogger.error('Error getting session', { error, component: 'AuthProvider' })
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          appLogger.info('Initial auth session loaded', { hasSession: !!session, component: 'AuthProvider' })

          // User sync will be handled by API routes when needed
        }
      } catch (error) {
        appLogger.error('Auth initialization error', { error, component: 'AuthProvider' })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    if (!supabase) {
      appLogger.warn('Supabase not initialized, skipping auth state changes', { component: 'AuthProvider' })
      return () => {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        appLogger.info('Auth state change', { event, hasUser: !!session?.user, component: 'AuthProvider' })

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle specific auth events
        if (event === 'SIGNED_IN' && session?.user) {
          appLogger.info('User signed in', { email: session.user.email, component: 'AuthProvider' })
          // User sync will be handled by API routes when needed
        } else if (event === 'SIGNED_OUT') {
          appLogger.info('User signed out', { component: 'AuthProvider' })
        } else if (event === 'TOKEN_REFRESHED') {
          appLogger.info('Token refreshed', { component: 'AuthProvider' })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted])

  const signOut = async () => {
    try {
      if (!supabase) {
        appLogger.warn('Supabase not initialized, cannot sign out', { component: 'AuthProvider' })
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        appLogger.error('Sign out error', { error, component: 'AuthProvider' })
        throw error
      }
      appLogger.info('User signed out successfully', { component: 'AuthProvider' })
    } catch (error) {
      appLogger.error('Failed to sign out', { error, component: 'AuthProvider' })
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!session && !!user
  }

  // Prevent hydration mismatches by rendering children immediately on server
  // The mounted state is just for client-side setup tracking
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        session: null,
        loading: true,
        signOut: async () => {},
        isAuthenticated: false
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}