'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SafeAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Simple timeout to simulate auth loading
    setTimeout(() => {
      setLoading(false)
    }, 100)
  }, [])

  const signOut = async () => {
    console.log('Sign out called in safe mode')
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: false
  }

  // Prevent hydration issues by not rendering children until mounted
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