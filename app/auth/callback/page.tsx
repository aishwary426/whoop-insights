'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your email confirmation...')

  useEffect(() => {
    let mounted = true
    let subscription: { unsubscribe: () => void } | null = null

    const handleAuthCallback = async () => {
      try {
        // Check both hash fragment and query parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search.substring(1))
        
        // Try hash first (Supabase default), then query params
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
        const error = hashParams.get('error') || queryParams.get('error')
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')
        const type = hashParams.get('type') || queryParams.get('type')

        // If there's an error in the URL, handle it
        if (error) {
          if (!mounted) return
          setStatus('error')
          setMessage(errorDescription || error || 'An error occurred during email confirmation.')
          // Clean up the URL
          window.history.replaceState({}, '', '/auth/callback')
          return
        }

        // If we have tokens, set the session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            throw sessionError
          }

          if (data.session && mounted) {
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting to login...')
            
            // Clean up the URL
            window.history.replaceState({}, '', '/auth/callback')
            
            // Redirect to login after a short delay
            setTimeout(() => {
              if (mounted) {
                router.push('/login')
              }
            }, 1500)
            return
          }
        }

        // Listen for auth state changes (Supabase may auto-process the callback)
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return

          if (event === 'SIGNED_IN' && session) {
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting to login...')
            
            // Clean up the URL
            window.history.replaceState({}, '', '/auth/callback')
            
            // Redirect to login after a short delay
            setTimeout(() => {
              if (mounted) {
                router.push('/login')
              }
            }, 1500)
          } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
            // Wait a bit more for the session to be established
            setTimeout(async () => {
              if (!mounted) return
              const { data: { session: currentSession } } = await supabase.auth.getSession()
              if (!currentSession && mounted) {
                setStatus('error')
                setMessage('Unable to confirm email. Please try clicking the link again or contact support.')
                window.history.replaceState({}, '', '/auth/callback')
              }
            }, 2000)
          }
        })
        subscription = authSubscription

        // Also check if we already have a session (in case Supabase auto-processed)
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
        
        if (sessionCheckError) {
          throw sessionCheckError
        }

        if (session && mounted) {
          setStatus('success')
          setMessage('Email confirmed successfully! Redirecting to login...')
          
          // Clean up the URL
          window.history.replaceState({}, '', '/auth/callback')
          
          // Redirect to login after a short delay
          setTimeout(() => {
            if (mounted) {
              router.push('/login')
            }
          }, 1500)
          
          // Clean up subscription
          if (subscription) {
            subscription.unsubscribe()
          }
          return
        }

        // If we have a type parameter but no tokens yet, wait a bit for Supabase to process
        if (type && !accessToken) {
          setTimeout(async () => {
            if (!mounted) return
            const { data: { session: delayedSession } } = await supabase.auth.getSession()
            if (delayedSession && mounted) {
              setStatus('success')
              setMessage('Email confirmed successfully! Redirecting to login...')
              window.history.replaceState({}, '', '/auth/callback')
              setTimeout(() => {
                if (mounted) {
                  router.push('/login')
                }
              }, 1500)
              if (subscription) {
                subscription.unsubscribe()
              }
            } else if (mounted) {
              setStatus('error')
              setMessage('Unable to confirm email. Please try clicking the link again or contact support.')
              window.history.replaceState({}, '', '/auth/callback')
              if (subscription) {
                subscription.unsubscribe()
              }
            }
          }, 3000)
          return
        }

        // If we get here and no type parameter, something went wrong
        if (!type && mounted) {
          setStatus('error')
          setMessage('Unable to confirm email. Please try clicking the link again or contact support.')
          window.history.replaceState({}, '', '/auth/callback')
          if (subscription) {
            subscription.unsubscribe()
          }
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        if (mounted) {
          setStatus('error')
          setMessage(err.message || 'An error occurred during email confirmation. Please try again.')
          window.history.replaceState({}, '', '/auth/callback')
        }
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }

    handleAuthCallback()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-bgDark">
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-neon mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Confirming your email...
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="mb-4">
                  <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Email Confirmed!
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="mb-4">
                  <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Confirmation Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-blue-500 dark:bg-neon text-white rounded-lg hover:bg-blue-600 dark:hover:bg-neon/80 transition-colors"
                >
                  Go to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

