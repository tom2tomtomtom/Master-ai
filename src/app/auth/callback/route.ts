import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { appLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const origin = requestUrl.origin
  
  appLogger.info('OAuth callback received', { 
    hasCode: !!code, 
    error,
    origin,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  if (error) {
    appLogger.logError('OAuth callback error', { error, origin })
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    try {
      const cookieStore = cookies()
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        appLogger.logError('Code exchange error during OAuth', { error, origin })
        return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
      }

      if (data.user) {
        appLogger.info('OAuth login successful', { 
          method: 'oauth_callback',
          provider: 'supabase',
          origin,
          userId: data.user.id,
          userEmail: data.user.email
        })
        
        // Redirect to dashboard
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      
    } catch (error) {
      appLogger.logError('OAuth callback processing error', { error, origin })
      return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code and no error - redirect to signin
  appLogger.info('OAuth callback: no code or error, redirecting to signin', { origin })
  return NextResponse.redirect(`${origin}/auth/signin`)
}