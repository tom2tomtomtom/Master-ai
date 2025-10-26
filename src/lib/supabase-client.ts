import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables (client-safe)
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('Supabase configuration error: NEXT_PUBLIC_SUPABASE_URL is required')
    return null
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key-here') {
    console.error('Supabase configuration error: NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
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

// Helper function to get current user
export async function getCurrentUser() {
  if (!supabase) {
    return null
  }
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user', { error })
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
    console.error('Error during sign out', { error })
  }
  return !error
}

if (config) {
  console.log('Supabase client initialized', {
    supabaseUrl: config.supabaseUrl,
    hasAnonKey: !!config.supabaseAnonKey,
    service: 'supabase'
  })
} else {
  console.warn('Supabase client not initialized: missing environment variables')
}