import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('WARNING: Missing Supabase environment variables. Using placeholders to prevent build failure.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email: string, password: string, name: string) => {
  try {
    // Check if Supabase client is properly configured
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
      return {
        data: null,
        error: {
          message: 'Supabase is not configured. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
          name: 'ConfigurationError'
        }
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    // Enhance error messages for network issues
    if (error) {
      const errorMessage = error.message || ''
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        return {
          data: null,
          error: {
            message: 'Failed to connect to Supabase. Please check: 1) Your .env.local file has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, 2) Your Supabase project is active, 3) Your internet connection is working.',
            name: 'NetworkError'
          }
        }
      }
    }

    return { data, error }
  } catch (err: any) {
    // Catch any unexpected errors (like fetch failures)
    const errorMessage = err.message || err.toString() || 'Unknown error'
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed')) {
      return {
        data: null,
        error: {
          message: 'Failed to connect to Supabase. Please verify your Supabase configuration in .env.local and ensure your Supabase project is running.',
          name: 'NetworkError'
        }
      }
    }
    return {
      data: null,
      error: {
        message: err.message || 'An unexpected error occurred during signup.',
        name: err.name || 'UnknownError'
      }
    }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    // Check if Supabase client is properly configured
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
      return {
        data: null,
        error: {
          message: 'Supabase is not configured. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
          name: 'ConfigurationError'
        }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Enhance error messages for network issues
    if (error) {
      const errorMessage = error.message || ''
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        return {
          data: null,
          error: {
            message: 'Failed to connect to Supabase. Please check: 1) Your .env.local file has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, 2) Your Supabase project is active, 3) Your internet connection is working.',
            name: 'NetworkError'
          }
        }
      }
    }

    return { data, error }
  } catch (err: any) {
    // Catch any unexpected errors (like fetch failures)
    const errorMessage = err.message || err.toString() || 'Unknown error'
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed')) {
      return {
        data: null,
        error: {
          message: 'Failed to connect to Supabase. Please verify your Supabase configuration in .env.local and ensure your Supabase project is running.',
          name: 'NetworkError'
        }
      }
    }
    return {
      data: null,
      error: {
        message: err.message || 'An unexpected error occurred during login.',
        name: err.name || 'UnknownError'
      }
    }
  }
}

export const signInWithGoogle = async () => {
  try {
    // Check if Supabase client is properly configured
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
      return {
        data: null,
        error: {
          message: 'Supabase is not configured. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
          name: 'ConfigurationError'
        }
      }
    }

    // Determine the redirect URL
    // Priority: 1) NEXT_PUBLIC_SITE_URL (production), 2) Current window origin (development/production)
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    // If not set, use current origin (handles both client and server side)
    if (!siteUrl && typeof window !== 'undefined') {
      siteUrl = window.location.origin
    }
    
    // Fallback for server-side rendering
    if (!siteUrl) {
      siteUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000'
    }
    
    // Ensure we have a valid URL
    if (!siteUrl || siteUrl === 'undefined') {
      siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    }
    
    // Construct the callback URL that Supabase will redirect to after OAuth
    const redirectTo = `${siteUrl}/auth/callback`
    
    console.log('Google OAuth redirect URL:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    return { data, error }
  } catch (err: any) {
    console.error('Google OAuth error:', err)
    return {
      data: null,
      error: {
        message: err.message || 'Failed to initiate Google sign-in. Please try again.',
        name: err.name || 'OAuthError'
      }
    }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
