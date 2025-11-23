'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase-client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      // Log the callback URL for easy debugging
      const callbackUrl = `${window.location.origin}/auth/callback`
      console.log('=== OAuth Callback Handler ===')
      console.log('Callback URL that must be configured in Supabase:')
      console.log(`   ${callbackUrl}`)
      console.log('Current full URL:', window.location.href)
      console.log('=============================')

      try {
        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
          throw new Error('Supabase is not configured. Please check your environment variables.')
        }

        // Try to get code from query parameters first
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Handle OAuth errors
        if (errorParam) {
          const errorMsg = errorDescription || errorParam || 'OAuth authentication failed'
          console.error('OAuth error:', errorParam, errorDescription)
          router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
          return
        }

        // If code is in query params, exchange it for session
        if (code) {
          console.log('Found code in query parameters, exchanging for session...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError)
            throw exchangeError
          }

          if (data.session) {
            console.log('Session created successfully, redirecting to dashboard...')
            // Use window.location for a hard redirect to ensure it works
            window.location.href = '/dashboard'
            return
          } else {
            throw new Error('No session created after code exchange')
          }
        }

        // If no code in query params, check hash fragment (client-side OAuth flow)
        // Supabase might redirect with code in hash for some flows
        const hash = window.location.hash
        if (hash) {
          console.log('Checking hash fragment for OAuth data...')
          const hashParams = new URLSearchParams(hash.substring(1))
          const hashCode = hashParams.get('code')
          const hashError = hashParams.get('error')
          const hashErrorDescription = hashParams.get('error_description')

          if (hashError) {
            const errorMsg = hashErrorDescription || hashError || 'OAuth authentication failed'
            console.error('OAuth error in hash:', hashError, hashErrorDescription)
            router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
            return
          }

          if (hashCode) {
            console.log('Found code in hash fragment, exchanging for session...')
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(hashCode)

            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError)
              throw exchangeError
            }

            if (data.session) {
              console.log('Session created successfully from hash, redirecting to dashboard...')
              // Clean up hash from URL and redirect
              window.location.href = '/dashboard'
              return
            } else {
              throw new Error('No session created after code exchange from hash')
            }
          }
        }

        // Try Supabase's built-in session detection as a fallback
        // This can sometimes detect sessions from URL fragments automatically
        console.log('No code found in query params or hash, checking for existing session...')
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
        } else if (sessionData.session) {
          console.log('Found existing session, redirecting to dashboard...')
          window.location.href = '/dashboard'
          return
        }

        // If we get here, no code was found
        console.error('No authorization code found in URL')
        console.log('Query params:', Object.fromEntries(searchParams.entries()))
        console.log('Hash:', window.location.hash)
        console.log('Full URL:', window.location.href)

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

        let redirectUrlInstructions = ''
        if (isLocalhost) {
          redirectUrlInstructions = `To allow ALL localhost URLs, add a wildcard pattern to your Supabase project:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to: Authentication → URL Configuration
4. Under "Redirect URLs", click "Add URL"
5. Add this exact URL: ${window.location.origin}/auth/callback
6. Also try adding: http://localhost:*/** (wildcard pattern)
7. Click "Save"

Current callback URL: ${window.location.origin}/auth/callback`
        } else {
          redirectUrlInstructions = `To fix this, add the following redirect URL to your Supabase project:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to: Authentication → URL Configuration
4. Under "Redirect URLs", click "Add URL"
5. Add this exact URL: ${window.location.origin}/auth/callback
6. Click "Save"

Current callback URL: ${window.location.origin}/auth/callback`
        }

        const errorMessage = `OAuth authentication failed: Missing authorization code.

${redirectUrlInstructions}

Also ensure:
- Google OAuth is enabled in Authentication → Providers → Google
- Your Google OAuth credentials are configured in Supabase
- The redirect URL in your code matches what's configured in Supabase

Full callback URL: ${window.location.href}

Note: If you're using a different port, make sure that exact URL (including port) is added to Supabase redirect URLs.`

        setError(errorMessage)
        setLoading(false)
      } catch (err: any) {
        console.error('Unexpected error in OAuth callback:', err)
        const errorMsg = err.message || 'An unexpected error occurred during authentication'
        setError(errorMsg)
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-bgDark">
        <div className="text-center max-w-md">
          <div className="text-red-500 dark:text-red-400 mb-4">Authentication Error</div>
          <p className="text-gray-600 dark:text-white/60 mb-4">{error}</p>
          <a
            href="/login"
            className="text-blue-500 dark:text-neon hover:underline"
          >
            Return to Login
          </a>
        </div>
      </div>
    )
  }

  // Always show loading state while processing or redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-bgDark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-neon mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-white/60">Completing authentication...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-bgDark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-neon mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white/60">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

