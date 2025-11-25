'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import { signIn } from '../../lib/auth'
import NeonButton from '../../components/ui/NeonButton'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Check for success messages in URL
  useEffect(() => {
    const messageParam = searchParams.get('message')

    if (messageParam) {
      setMessage(decodeURIComponent(messageParam))
      // Clean up URL by removing message parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error, data } = await signIn(formData.email, formData.password)

      if (error) {
        throw error
      }

      // Redirect immediately - session is already set by Supabase
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      // Display the error message from Supabase or our custom error handling
      const errorMessage = error?.message || 'Failed to login. Please check your credentials and try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-bgDark">
      <div className="relative z-10">
        <AuthCard
          title="Welcome back"
          subtitle="Sign in to access your AI training insights"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all"
                placeholder="your@email.com"
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

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/60">
              <label className="flex items-center gap-2 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                <input type="checkbox" className="rounded border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-blue-500 dark:text-neon focus:ring-blue-500 dark:focus:ring-neon/50" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-blue-500 dark:text-neon hover:text-blue-600 dark:hover:text-neon/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            {message && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                {message}
              </div>
            )}

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
              {loading ? 'Signing in...' : 'Sign In'}
            </NeonButton>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-white/60">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500 dark:text-neon hover:text-blue-600 dark:hover:text-neon/80 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </AuthCard>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-bgDark flex items-center justify-center">
        <div className="relative z-10 text-gray-900 dark:text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
