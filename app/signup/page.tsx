'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import { signUp } from '../../lib/auth'
import NeonButton from '../../components/ui/NeonButton'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'

function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error, data } = await signUp(formData.email, formData.password, formData.name)
      
      if (error) {
        console.error('Signup error:', error)
        // Display a more user-friendly error message
        const errorMessage = error.message || 'Failed to create account. Please try again.'
        setError(errorMessage)
        return
      }

      // Check if signup was successful (even if email confirmation is required)
      if (data) {
        // Redirect to login with confirmation message
        router.push('/login?message=' + encodeURIComponent('You must have received a confirmation email. Please check your inbox and click the confirmation link to activate your account.'))
      } else {
        setError('Signup failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Signup exception:', error)
      // Handle network errors and other exceptions
      const errorMessage = error?.message || error?.toString() || 'Failed to create account. Please check your connection and try again.'
      
      // Check for common network errors
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server. Please check your internet connection and ensure Supabase is configured correctly.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-bgDark">
      <TranscendentalBackground />
      <div className="relative z-10">
        <AuthCard
          title="Create your account"
          subtitle="Start your journey to smarter training and faster recovery"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <NeonButton
              type="submit"
              disabled={loading}
              className="w-full justify-center"
              variant="primary"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </NeonButton>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-white/60">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500 dark:text-neon hover:text-blue-600 dark:hover:text-neon/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </AuthCard>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-bgDark flex items-center justify-center">
        <TranscendentalBackground />
        <div className="relative z-10 text-gray-900 dark:text-white">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
