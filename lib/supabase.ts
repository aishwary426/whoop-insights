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
  // Use NEXT_PUBLIC_SITE_URL if set (for production), otherwise use current origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const redirectTo = `${siteUrl}/dashboard`
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo
    }
  })
  return { data, error }
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
