'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import { signUp } from '../../lib/auth'
import NeonButton from '../../components/ui/NeonButton'

// List of all countries - sorted once at module load time for performance
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
].sort()

function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    nationality: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate name - cannot be empty or just whitespace
    if (!formData.name || formData.name.trim().length === 0) {
      setError('Name is required and cannot be empty')
      return
    }

    // Validate name - only letters and spaces allowed
    const namePattern = /^[a-zA-Z\s]+$/
    if (!namePattern.test(formData.name.trim())) {
      setError('Name can only contain letters and spaces. No numbers, symbols, hyphens, or apostrophes allowed.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Validate age
    const age = parseInt(formData.age)
    if (isNaN(age) || age < 1 || age > 120) {
      setError('Please enter a valid age (1-120)')
      return
    }

    setLoading(true)

    try {
      const { error, data } = await signUp(
        formData.email, 
        formData.password, 
        formData.name,
        age,
        formData.nationality
      )
      
      if (error) {
        console.error('Signup error:', error)
        // Display a more user-friendly error message
        let errorMessage = error.message || 'Failed to create account. Please try again.'
        
        // Handle specific error types
        if (error.name === 'TimeoutError' || errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
          errorMessage = 'Signup request timed out. This can happen if your connection is slow or Supabase is experiencing high load. Please check your internet connection and try again. If the problem persists, wait a moment and retry.'
        } else if (errorMessage.toLowerCase().includes('rate limit') || 
            errorMessage.toLowerCase().includes('too many requests') ||
            errorMessage.toLowerCase().includes('email rate limit')) {
          errorMessage = 'Email rate limit exceeded. This usually happens when too many signup attempts are made in a short time. Please wait a few minutes before trying again, or contact support if you continue to see this error.'
        }
        
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
      
      // Check for timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out') || error?.name === 'TimeoutError') {
        setError('Signup request timed out. This can happen if your connection is slow or Supabase is experiencing high load. Please check your internet connection and try again. If the problem persists, wait a moment and retry.')
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all appearance-none"
                  placeholder="25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Nationality</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-neon/50 focus:ring-1 focus:ring-blue-500 dark:focus:ring-neon/50 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="text-gray-400 dark:text-white/30">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country} className="text-gray-900 dark:text-white">
                      {country}
                    </option>
                  ))}
                </select>
              </div>
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
        <div className="relative z-10 text-gray-900 dark:text-white">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
