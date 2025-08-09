import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  
  console.log('🔐 OAuth callback received:', { code: !!code, error })

  if (error) {
    console.error('❌ OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${error}`)
  }

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Code exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=code_exchange_failed`)
      }

      console.log('✅ OAuth success, redirecting to dashboard')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback_failed`)
    }
  }

  // No code and no error - redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`)
}