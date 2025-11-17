'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '../../lib/supabase'
import { getUserStats } from '../../lib/dataParser'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    avgRecovery: '--',
    avgStrain: '--'
  })
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      setLoading(false)
      // Load user stats
      loadUserStats(currentUser.id)
    }
  }

  const loadUserStats = async (userId) => {
    setLoadingStats(true)
    try {
      const userStats = await getUserStats(userId)
      if (userStats) {
        setStats(userStats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  const hasData = stats.totalWorkouts > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - same as before */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold gradient-text">
                🎯 Whoop Insights Pro
              </Link>
              <div className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-gray-700 hover:text-purple-600 font-medium transition">
                  Dashboard
                </Link>
                <Link href="/upload" className="text-gray-700 hover:text-purple-600 font-medium transition">
                  Upload Data
                </Link>
                <Link href="/calorie-gps" className="text-gray-700 hover:text-purple-600 font-medium transition">
                  Calorie GPS
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-gray-600 text-sm">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 animate-float">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.user_metadata?.name || 'Athlete'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            {hasData ? 'Here\'s your latest performance data' : 'Ready to optimize your training and unlock your potential?'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card-hover border-l-4 border-purple-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-500 font-semibold mb-2">Your Recovery</div>
                <div className="text-4xl font-bold text-gray-800 mb-1">
                  {loadingStats ? '...' : (hasData ? `${stats.avgRecovery}%` : '--')}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData ? 'Average recovery score' : 'Upload data to see'}
                </div>
              </div>
              <div className="text-4xl">💚</div>
            </div>
            {hasData && stats.avgRecovery !== '--' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${stats.avgRecovery}%`}}
                ></div>
              </div>
            )}
          </div>

          <div className="card-hover border-l-4 border-indigo-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-500 font-semibold mb-2">Total Workouts</div>
                <div className="text-4xl font-bold text-gray-800 mb-1">
                  {loadingStats ? '...' : stats.totalWorkouts}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData ? 'Workouts tracked' : 'No data uploaded yet'}
                </div>
              </div>
              <div className="text-4xl">💪</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {hasData ? 'Keep up the great work!' : 'Upload your Whoop data to start tracking'}
            </div>
          </div>

          <div className="card-hover border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-500 font-semibold mb-2">Avg Strain</div>
                <div className="text-4xl font-bold text-gray-800 mb-1">
                  {loadingStats ? '...' : (hasData ? stats.avgStrain : '--')}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData ? 'Daily average' : 'Upload data to see'}
                </div>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Based on your workout intensity
            </div>
          </div>
        </div>

        {/* Refresh Button if data exists */}
        {hasData && (
          <div className="mb-8 text-center">
            <button
              onClick={() => loadUserStats(user.id)}
              disabled={loadingStats}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-2 px-6 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
            >
              {loadingStats ? '🔄 Refreshing...' : '🔄 Refresh Stats'}
            </button>
          </div>
        )}

        {/* Rest of dashboard - action cards, features, etc. (keeping existing code) */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4">📦</div>
              <h2 className="text-3xl font-bold mb-4">Upload Your Data</h2>
              <p className="mb-6 text-purple-100">
                Get started by uploading your Whoop export. We'll analyze your patterns and give you personalized insights in seconds.
              </p>
              <Link href="/upload" className="inline-block bg-white text-purple-600 font-bold py-3 px-8 rounded-xl hover:bg-purple-50 transition-all hover:scale-105 shadow-lg">
                Upload Now →
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold mb-4">Calorie-Burn GPS</h2>
              <p className="mb-6 text-pink-100">
                Your ML-powered workout optimizer. Find the most efficient exercise for your recovery state. Burn more in less time!
              </p>
              <Link href="/calorie-gps" className="inline-block bg-white text-pink-600 font-bold py-3 px-8 rounded-xl hover:bg-pink-50 transition-all hover:scale-105 shadow-lg">
                Try Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Features and rest of content remains the same... */}
      </div>
    </div>
  )
}
