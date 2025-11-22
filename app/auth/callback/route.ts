import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  // Handle missing code
  if (!code) {
    console.error('OAuth callback missing code parameter')
    return NextResponse.redirect(
      new URL('/login?error=missing_code', requestUrl.origin)
    )
  }

  // Exchange code for session
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured')
    return NextResponse.redirect(
      new URL('/login?error=configuration_error', requestUrl.origin)
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    if (data.session) {
      // Successfully authenticated - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    } else {
      // No session created
      return NextResponse.redirect(
        new URL('/login?error=no_session', requestUrl.origin)
      )
    }
  } catch (err: any) {
    console.error('Unexpected error in OAuth callback:', err)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || 'unknown_error')}`, requestUrl.origin)
    )
  }
}

