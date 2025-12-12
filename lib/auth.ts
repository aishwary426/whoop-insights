import { supabase } from './supabase-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Cache the site URL to avoid recalculating on every signup
let cachedSiteUrl: string | null = null

/**
 * Get a valid site URL for redirects with proper validation
 * Ensures the URL is complete, has a protocol, and includes port for localhost
 * Results are cached for performance
 */
function getValidSiteUrl(): string {
    // Return cached value if available
    if (cachedSiteUrl) {
        return cachedSiteUrl
    }

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

    // Cache the result
    cachedSiteUrl = siteUrl
    return siteUrl
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ])
}

// Auth helpers
export const signUp = async (email: string, password: string, name: string, age?: number, nationality?: string) => {
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

        // Get a valid site URL for redirects (cached for performance)
        const siteUrl = getValidSiteUrl()
        const redirectTo = `${siteUrl}/auth/callback`

        // Signup with reasonable timeout - Supabase may need time to send confirmation email
        try {
            // Increased timeout to 20s to allow for email sending and network latency
            const signUpPromise = supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        full_name: name, // Standard field for Supabase
                        display_name: name, // Standard field for Supabase
                        age: age,
                        nationality: nationality,
                    },
                    emailRedirectTo: redirectTo,
                },
            })

            const { data, error } = await withTimeout(signUpPromise, 20000)

            if (error) {
                // Enhance error messages for network issues
                const errorMessage = error?.message || ''
                
                // Check for rate limit errors first
                if (errorMessage.toLowerCase().includes('rate limit') || 
                    errorMessage.toLowerCase().includes('too many requests') ||
                    errorMessage.toLowerCase().includes('email rate limit') ||
                    error?.status === 429) {
                    return {
                        data: null,
                        error: {
                            message: 'Email rate limit exceeded. Too many signup attempts were made. Please wait a few minutes before trying again.',
                            name: 'RateLimitError'
                        }
                    }
                }
                
                if (errorMessage.includes('Failed to fetch') ||
                    errorMessage.includes('NetworkError') ||
                    errorMessage.includes('fetch') ||
                    errorMessage.includes('Load failed') ||
                    errorMessage.includes('timeout') ||
                    error?.name === 'NetworkError') {
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
            // Handle timeout and other errors
            const errorMessage = err?.message || err?.toString() || ''
            if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
                return {
                    data: null,
                    error: {
                        message: 'Signup request timed out. This can happen if: 1) Your internet connection is slow, 2) Supabase is experiencing high load, or 3) There are network issues. Please check your connection and try again. If the problem persists, wait a moment and retry.',
                        name: 'TimeoutError'
                    }
                }
            }
            throw err
        }
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

export const prefetchDashboard = () => {
    if (typeof window !== 'undefined') {
        // Prefetch the dashboard page
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = '/dashboard'
        document.head.appendChild(link)
    }
}

export const signIn = async (email: string, password: string) => {
    try {
        // Start prefetching dashboard immediately
        prefetchDashboard()

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

        // Add timeout for faster failure detection (8 seconds)
        const signInPromise = supabase.auth.signInWithPassword({
            email,
            password,
        })

        const { data, error } = await withTimeout(signInPromise, 8000)

        // Enhance error messages for network issues
        if (error) {
            const errorMessage = error.message || ''
            if (errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('NetworkError') ||
                errorMessage.includes('fetch') ||
                errorMessage.includes('Load failed') ||
                errorMessage.includes('timeout')) {
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
        // Handle timeout and other errors
        const errorMessage = err?.message || err?.toString() || 'Unknown error'
        if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
            return {
                data: null,
                error: {
                    message: 'Request timed out. Please check your connection and try again.',
                    name: 'TimeoutError'
                }
            }
        }
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
