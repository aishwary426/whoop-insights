'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthCard from '../../components/auth/AuthCard'
import NeonButton from '../../components/ui/NeonButton'
import { resetPassword } from '../../lib/auth'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            const { error } = await resetPassword(email)
            if (error) throw error
            setMessage('Check your email for the password reset link')
        } catch (error: any) {
            setError(error.message || 'Failed to send reset email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-bgDark">
            <div className="relative z-10">
                <AuthCard
                    title="Reset Password"
                    subtitle="Enter your email to receive a reset link"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        {message && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                {message}
                            </div>
                        )}

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
                            {loading ? 'Sending link...' : 'Send Reset Link'}
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
