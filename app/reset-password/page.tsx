'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import NeonButton from '../../components/ui/NeonButton'
import { supabase } from '../../lib/supabase-client'
import { updatePassword } from '../../lib/auth'

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

    // Check if we have a valid recovery token
    useEffect(() => {
        const checkToken = async () => {
            try {
                // Supabase automatically handles recovery tokens from URL hash fragments
                // When a user clicks the reset link, Supabase parses the hash and creates a session
                // We need to wait a bit for Supabase to process the hash, then check for session

                // First, check if there's a recovery token in the URL hash
                if (typeof window !== 'undefined') {
                    const hashParams = new URLSearchParams(window.location.hash.substring(1))
                    const type = hashParams.get('type')
                    const accessToken = hashParams.get('access_token')

                    // If we have recovery tokens in the hash, Supabase will process them
                    if (type === 'recovery' && accessToken) {
                        // Wait a moment for Supabase to process the hash
                        await new Promise(resolve => setTimeout(resolve, 500))
                    }
                }

                // Check if we have a valid session (Supabase creates one from the recovery token)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (session) {
                    setIsValidToken(true)
                } else if (typeof window !== 'undefined') {
                    // Check URL hash as fallback
                    const hashParams = new URLSearchParams(window.location.hash.substring(1))
                    const type = hashParams.get('type')
                    const accessToken = hashParams.get('access_token')

                    if (type === 'recovery' && accessToken) {
                        // Token is in URL but session not created yet - might need to wait
                        setIsValidToken(true)
                    } else {
                        setIsValidToken(false)
                        setError('Invalid or expired reset link. Please request a new password reset.')
                    }
                } else {
                    setIsValidToken(false)
                    setError('Invalid or expired reset link. Please request a new password reset.')
                }
            } catch (err) {
                console.error('Error checking token:', err)
                setIsValidToken(false)
                setError('Unable to verify reset link. Please request a new password reset.')
            }
        }

        checkToken()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        // Validate password strength
        if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            setLoading(false)
            return
        }

        try {
            // Update the user's password using the helper function
            const { error: updateError } = await updatePassword(password)

            if (updateError) {
                throw updateError
            }

            // Success!
            setSuccess(true)

            // Redirect to login after a short delay
            setTimeout(() => {
                router.push('/login?message=Password reset successful. Please sign in with your new password.')
            }, 2000)
        } catch (error: any) {
            console.error('Password reset error:', error)
            setError(error.message || 'Failed to reset password. The link may have expired. Please request a new one.')
        } finally {
            setLoading(false)
        }
    }

    // Show loading state while checking token
    if (isValidToken === null) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-bgDark">
                <div className="relative z-10">
                    <AuthCard
                        title="Verifying Reset Link"
                        subtitle="Please wait..."
                    >
                        <div className="text-center text-white/60">Checking your reset link...</div>
                    </AuthCard>
                </div>
            </div>
        )
    }

    // Show error if token is invalid
    if (isValidToken === false) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-bgDark">
                <div className="relative z-10">
                    <AuthCard
                        title="Invalid Reset Link"
                        subtitle="This password reset link is invalid or has expired"
                    >
                        <div className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <Link href="/forgot-password">
                                <NeonButton
                                    type="button"
                                    className="w-full justify-center"
                                    variant="primary"
                                >
                                    Request New Reset Link
                                </NeonButton>
                            </Link>

                            <p className="text-center text-sm text-white/60">
                                <Link href="/login" className="text-blue-500 dark:text-neon hover:text-blue-600 dark:hover:text-neon/80 font-medium transition-colors">
                                    Back to Sign In
                                </Link>
                            </p>
                        </div>
                    </AuthCard>
                </div>
            </div>
        )
    }

    // Show success message
    if (success) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-bgDark">
                <div className="relative z-10">
                    <AuthCard
                        title="Password Reset Successful"
                        subtitle="Your password has been updated"
                    >
                        <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                                Your password has been successfully reset. Redirecting to login...
                            </div>
                        </div>
                    </AuthCard>
                </div>
            </div>
        )
    }

    // Show password reset form
    return (
        <div className="relative min-h-screen overflow-hidden bg-bgDark">
            <div className="relative z-10">
                <AuthCard
                    title="Set New Password"
                    subtitle="Enter your new password below"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-white/40">Must be at least 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <NeonButton
                            type="submit"
                            disabled={loading}
                            className="w-full justify-center"
                            variant="primary"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </NeonButton>
                    </form>

                    <p className="mt-8 text-center text-sm text-white/60">
                        Remember your password?{' '}
                        <Link href="/login" className="text-blue-500 dark:text-neon hover:text-blue-600 dark:hover:text-neon/80 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </AuthCard>
            </div>
        </div>
    )
}

