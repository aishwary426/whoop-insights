import { supabase } from './supabase-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

/**
 * Get a valid site URL for redirects with proper validation
 * Ensures the URL is complete, has a protocol, and includes port for localhost
 */
function getValidSiteUrl(): string {
    let siteUrl: string | null = null

    // First, try to use window.location.origin if available (most reliable)
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
        siteUrl = window.location.origin
    }

    // If window.location.origin is not available, try NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
        siteUrl = process.env.NEXT_PUBLIC_SITE_URL || null
    }

    // Validate and fix the URL if needed
    if (siteUrl) {
        // Remove trailing slash
        siteUrl = siteUrl.replace(/\/$/, '')
        
        // Check if URL is valid and complete
        try {
            // If URL doesn't start with http:// or https://, add http://
            if (!siteUrl.match(/^https?:\/\//i)) {
                // If it looks like localhost without protocol, add http://
                if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
                    siteUrl = `http://${siteUrl}`
                } else {
                    // For production URLs, default to https
                    siteUrl = `https://${siteUrl}`
                }
            }
            
            // Validate the URL by creating a URL object
            const urlObj = new URL(siteUrl)
            
            // Ensure localhost URLs have a port number
            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                if (!urlObj.port) {
                    // Default to port 3000 for localhost
                    urlObj.port = '3000'
                }
                siteUrl = urlObj.origin
            } else {
                siteUrl = urlObj.origin
            }
        } catch (e) {
            // If URL parsing fails, reset to null and use fallback
            console.warn('Invalid site URL format, using fallback:', siteUrl)
            siteUrl = null
        }
    }

    // Fallback for server-side rendering or invalid URLs
    if (!siteUrl) {
        if (process.env.NEXT_PUBLIC_VERCEL_URL) {
            siteUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, '')}`
        } else {
            siteUrl = 'http://localhost:3000'
        }
    }

    return siteUrl
}

// Auth helpers
export const signUp = async (email: string, password: string, name: string) => {
    try {
        // Check if Supabase client is properly configured
        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
            console.error('Supabase configuration error:', {
                url: supabaseUrl,
                hasKey: !!supabaseAnonKey,
                keyIsPlaceholder: supabaseAnonKey === 'placeholder'
            })
            return {
                data: null,
                error: {
                    message: 'Supabase is not configured. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. Make sure to restart your development server after adding these variables.',
                    name: 'ConfigurationError'
                }
            }
        }

        // Get a valid site URL for redirects
        const siteUrl = getValidSiteUrl()
        const redirectTo = `${siteUrl}/auth/callback`

        // Retry logic for network failures (common on first request)
        let lastError: any = null
        const maxRetries = 2
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name,
                        },
                        emailRedirectTo: redirectTo,
                    },
                })

                // If successful, return immediately
                if (!error && data) {
                    return { data, error: null }
                }

                // If error is not a network error, return immediately
                const errorMessage = error?.message || ''
                const isNetworkError = errorMessage.includes('Failed to fetch') || 
                                     errorMessage.includes('NetworkError') || 
                                     errorMessage.includes('fetch') ||
                                     errorMessage.includes('Load failed') ||
                                     error?.name === 'NetworkError'

                if (!isNetworkError) {
                    // Not a network error, return the error
                    return { data, error }
                }

                // Network error - store for retry
                lastError = error
                
                // If this is not the last attempt, wait a bit before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    continue
                }
            } catch (err: any) {
                // Check if it's a network error
                const errorMessage = err?.message || err?.toString() || ''
                const isNetworkError = errorMessage.includes('fetch') || 
                                     errorMessage.includes('network') || 
                                     errorMessage.includes('Failed') ||
                                     errorMessage.includes('Load failed') ||
                                     err?.name === 'TypeError' ||
                                     err?.name === 'NetworkError'

                if (!isNetworkError) {
                    // Not a network error, throw immediately
                    throw err
                }

                // Network error - store for retry
                lastError = err
                
                // If this is not the last attempt, wait a bit before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    continue
                }
            }
        }

        // All retries failed - return the last error
        if (lastError) {
            return {
                data: null,
                error: {
                    message: 'Failed to connect to Supabase after multiple attempts. Please check: 1) Your .env.local file has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, 2) Your Supabase project is active, 3) Your internet connection is working.',
                    name: 'NetworkError'
                }
            }
        }

        return { data: null, error: lastError }
    } catch (err: any) {
        // Catch any unexpected errors (like fetch failures, Load failed, etc.)
        const errorMessage = err.message || err.toString() || 'Unknown error'
        console.error('Signup catch error:', err)
        
        // Check for various network/connection error patterns
        if (errorMessage.includes('fetch') || 
            errorMessage.includes('network') || 
            errorMessage.includes('Failed') ||
            errorMessage.includes('Load failed') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('ERR_') ||
            err.name === 'TypeError' ||
            err.name === 'NetworkError') {
            return {
                data: null,
                error: {
                    message: 'Failed to connect to Supabase. Please check: 1) Your .env.local file has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, 2) Your Supabase project is active and running, 3) Your internet connection is working, 4) Restart your development server after adding environment variables.',
                    name: 'NetworkError'
                }
            }
        }
        return {
            data: null,
            error: {
                message: err.message || 'An unexpected error occurred during signup. Please try again.',
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


export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
}

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export const getCurrentUserEmail = async () => {
    const user = await getCurrentUser()
    return user?.email || null
}

export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

export const resetPassword = async (email: string) => {
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

        // Get a valid site URL with proper validation
        const siteUrl = getValidSiteUrl()
        const redirectTo = `${siteUrl}/reset-password`

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
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
                message: err.message || 'An unexpected error occurred while sending password reset email.',
                name: err.name || 'UnknownError'
            }
        }
    }
}

export const updatePassword = async (newPassword: string) => {
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

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        })

        // Enhance error messages
        if (error) {
            const errorMessage = error.message || ''
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
                return {
                    data: null,
                    error: {
                        message: 'Failed to connect to Supabase. Please check your connection and try again.',
                        name: 'NetworkError'
                    }
                }
            }
        }

        return { data, error }
    } catch (err: any) {
        return {
            data: null,
            error: {
                message: err.message || 'An unexpected error occurred while updating password.',
                name: err.name || 'UnknownError'
            }
        }
    }
}
