import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Get Supabase configuration from environment variables
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is required')
    return null
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key-here') {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please configure it in your environment variables.')
    return null
  }

  return {
    supabaseUrl,
    supabaseAnonKey
  }
}

// Get Supabase configuration
const config = getSupabaseConfig()

// Client-side Supabase client with error handling
export const supabase = config ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : (() => {
  console.warn('Supabase client not initialized due to missing configuration')
  return null as any
})()

// Server-side Supabase client for API routes and server components
export const createServerSupabaseClient = (cookieStore: ReturnType<typeof cookies>) => {
  if (!config) {
    throw new Error('Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createServerClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

// Helper function to get current user
export async function getCurrentUser() {
  if (!supabase) {
    return null
  }
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper function to sign out
export async function signOut() {
  if (!supabase) {
    return false
  }
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
  return !error
}

if (config) {
  console.log('🚀 Supabase client initialized:', {
    url: config.supabaseUrl,
    hasAnonKey: !!config.supabaseAnonKey
  })
} else {
  console.warn('🚫 Supabase client not initialized: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
}