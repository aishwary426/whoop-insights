#!/bin/bash

echo "🎨 UPGRADING TO ULTRA-MODERN VERSION"
echo "===================================="
echo ""

# 1. Install additional dependencies
echo "�� Installing new dependencies..."
npm install @tensorflow/tfjs recharts react-icons framer-motion

# 2. Update globals.css with glassmorphism
cat > app/globals.css << 'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900;
    font-feature-settings: "rlig" 1, "calt" 1;
    min-height: 100vh;
  }
}

@layer components {
  /* Glassmorphism Cards */
  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .glass-dark {
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .glass-white {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  /* Modern Buttons */
  .btn-primary {
    @apply relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 hover:scale-105 active:scale-95;
  }

  .btn-glass {
    @apply glass text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95;
  }
  
  /* Modern Input Fields */
  .input-glass {
    @apply w-full glass px-6 py-4 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none transition-all duration-300;
  }

  .input-glass::placeholder {
    @apply text-white/40;
  }

  /* Password dots */
  .input-glass[type="password"] {
    letter-spacing: 0.3em;
  }

  /* Modern Cards */
  .card-glass {
    @apply glass rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer;
  }

  .card-glass-white {
    @apply glass-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300;
  }

  /* Gradient Text */
  .gradient-text {
    @apply bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient;
  }

  /* Animated Gradient */
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }

  /* Floating Animation */
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  /* Glow Effect */
  .glow {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4),
                0 0 40px rgba(168, 85, 247, 0.2);
  }

  .glow-pink {
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.4),
                0 0 40px rgba(236, 72, 153, 0.2);
  }

  /* Shimmer Effect */
  .shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Stats Card */
  .stat-card {
    @apply relative glass-white rounded-3xl p-6 overflow-hidden;
  }

  .stat-card::before {
    content: '';
    @apply absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #8b5cf6, #ec4899);
    border-radius: 5px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #7c3aed, #db2777);
  }
}

/* Particle Background */
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: particle-float 20s infinite ease-in-out;
}

@keyframes particle-float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(100px);
    opacity: 0;
  }
}

/* Loading Spinner */
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #8b5cf6;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
CSS

echo "✅ Updated global styles with glassmorphism"

# 3. Update Login page with modern UI
cat > app/login/page.js << 'LOGIN'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await signIn(formData.email, formData.password)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      setError(error.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-float">
          <Link href="/" className="inline-block">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Whoop Insights Pro
            </h1>
            <p className="text-white/60">Welcome back, athlete</p>
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass-white rounded-3xl p-8 shadow-2xl glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full glass px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 bg-white/50"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full glass px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 bg-white/50"
                  placeholder="••••••••"
                  required
                  style={!showPassword ? { letterSpacing: '0.3em' } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="glass-dark text-red-300 p-4 rounded-2xl text-sm border border-red-500/30">
                ❌ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-5 !h-5 !border-2"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 rounded-full">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button className="w-full glass flex items-center justify-center gap-3 py-4 rounded-2xl hover:bg-white/30 transition-all duration-300 font-semibold text-gray-700 group">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="group-hover:text-gray-900 transition-colors">Continue with Google</span>
          </button>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">
              Sign Up Free →
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-white/40">
          Built with ❤️ for athletes
        </p>
      </div>
    </div>
  )
}
LOGIN

echo "✅ Updated login page with modern glassmorphism UI"

# Continue with signup page...
cat > app/signup/page.js << 'SIGNUP'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '../../lib/supabase'

export default function SignupPage() {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.name
      )

      if (error) throw error

      router.push('/upload')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${Math.random() * 10 + 15}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-float">
          <Link href="/" className="inline-block">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Whoop Insights Pro
            </h1>
            <p className="text-white/60">Start your journey to peak performance</p>
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass-white rounded-3xl p-8 shadow-2xl glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full glass px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 bg-white/50"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full glass px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 bg-white/50"
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full glass px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 bg-white/50"
                  placeholder="••••••••"
                  required
                  style={!showPassword ? { letterSpacing: '0.3em' } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full glass px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all duration-300 bg-white/50"
                placeholder="••••••••"
                required
                style={!showPassword ? { letterSpacing: '0.3em' } : {}}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="glass-dark text-red-300 p-4 rounded-2xl text-sm border border-red-500/30">
                ❌ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-5 !h-5 !border-2"></div>
                    Creating account...
                  </span>
                ) : (
                  'Create Account →'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 rounded-full">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button className="w-full glass flex items-center justify-center gap-3 py-4 rounded-2xl hover:bg-white/30 transition-all duration-300 font-semibold text-gray-700 group">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="group-hover:text-gray-900 transition-colors">Continue with Google</span>
          </button>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">
              Sign In →
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-white/40">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
SIGNUP

echo "✅ Updated signup page with modern glassmorphism UI"

echo ""
echo "=========================================="
echo "🎉 UI/UX UPGRADE COMPLETE!"
echo "=========================================="
echo ""
echo "Changes made:"
echo "✅ Glassmorphism design throughout"
echo "✅ Password fields show dots (••••••••)"
echo "✅ Show/hide password toggle"
echo "✅ Animated floating particles background"
echo "✅ Smooth transitions and hover effects"
echo "✅ Modern gradient buttons"
echo "✅ Enhanced form inputs"
echo "✅ Loading spinners"
echo "✅ Better error messages"
echo ""
echo "Restart your server to see changes:"
echo "npm run dev"
echo ""
