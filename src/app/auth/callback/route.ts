import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const origin = requestUrl.origin
  
  console.log('🔐 OAuth callback received:', { 
    code: !!code, 
    error,
    origin,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  if (error) {
    console.error('❌ OAuth error:', error)
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
        console.error('❌ Code exchange error:', error)
        return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
      }

      if (data.user) {
        console.log('✅ OAuth success for user:', data.user.email)
        
        // Redirect to dashboard
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code and no error - redirect to signin
  console.log('🔄 No code or error, redirecting to signin')
  return NextResponse.redirect(`${origin}/auth/signin`)
}