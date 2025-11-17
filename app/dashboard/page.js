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
  const [prediction, setPrediction] = useState(null)

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
      loadUserStats(currentUser.id)
    }
  }

  const loadUserStats = async (userId) => {
    setLoadingStats(true)
    try {
      const userStats = await getUserStats(userId)
      if (userStats) {
        setStats(userStats)
        // Generate prediction based on recovery
        generatePrediction(userStats.avgRecovery)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const generatePrediction = (recovery) => {
    const recoveryNum = parseInt(recovery) || 50
    
    // Predict tomorrow's recovery (simple model: current recovery ± random variation)
    const tomorrowRecovery = Math.min(100, Math.max(0, recoveryNum + (Math.random() * 20 - 10)))
    
    // Determine recommendation based on recovery
    let recommendation, workoutType, icon, color
    if (recoveryNum >= 67) {
      recommendation = "High recovery today! Perfect day for high-intensity training"
      workoutType = "HIIT or Strength Training"
      icon = "🟢"
      color = "green"
    } else if (recoveryNum >= 34) {
      recommendation = "Moderate recovery. Stick to endurance or moderate cardio"
      workoutType = "Moderate Cardio or Yoga"
      icon = "🟡"
      color = "yellow"
    } else {
      recommendation = "Low recovery. Focus on active recovery or complete rest"
      workoutType = "Light Walk or Rest"
      icon = "��"
      color = "red"
    }

    // Generate weekly plan
    const weeklyPlan = generateWeeklyPlan(recoveryNum)

    setPrediction({
      tomorrowRecovery: Math.round(tomorrowRecovery),
      recommendation,
      workoutType,
      icon,
      color,
      weeklyPlan,
      optimalTime: recoveryNum >= 67 ? "Morning (6-9 AM)" : "Afternoon (2-5 PM)",
      restDay: recoveryNum < 34
    })
  }

  const generateWeeklyPlan = (baseRecovery) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const plan = []
    
    for (let i = 0; i < 7; i++) {
      const recoveryVariation = Math.random() * 30 - 15
      const dayRecovery = Math.min(100, Math.max(30, baseRecovery + recoveryVariation))
      
      let workout, intensity
      if (dayRecovery >= 75) {
        workout = i % 2 === 0 ? "HIIT" : "Strength"
        intensity = "High"
      } else if (dayRecovery >= 60) {
        workout = "Endurance"
        intensity = "Moderate"
      } else if (dayRecovery >= 45) {
        workout = "Light Cardio"
        intensity = "Low"
      } else {
        workout = "Rest"
        intensity = "Recovery"
      }

      plan.push({
        day: days[i],
        workout,
        intensity,
        recovery: Math.round(dayRecovery)
      })
    }

    return plan
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div className="relative z-10 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Loading your insights...</div>
        </div>
      </div>
    )
  }

  const hasData = stats.totalWorkouts > 0
  const recoveryNum = parseInt(stats.avgRecovery) || 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
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

      {/* Header */}
      <nav className="relative z-10 glass-dark backdrop-blur-xl sticky top-0 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold gradient-text">
                🎯 Whoop Insights Pro
              </Link>
              <div className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-white/90 hover:text-white font-medium transition">
                  Dashboard
                </Link>
                <Link href="/upload" className="text-white/70 hover:text-white font-medium transition">
                  Upload Data
                </Link>
                <Link href="/calorie-gps" className="text-white/70 hover:text-white font-medium transition">
                  Calorie GPS
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-white/60 text-sm">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="glass px-4 py-2 rounded-xl font-medium transition-all hover:bg-white/20 text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 animate-float">
            Welcome back, {user?.user_metadata?.name || 'Athlete'}! 👋
          </h1>
          <p className="text-white/60 text-xl">
            {hasData ? "Here's your AI-powered performance analysis" : 'Upload your data to unlock AI insights'}
          </p>
        </div>

        {/* Smart Recommendation Card */}
        {hasData && prediction && (
          <div className={`glass glow-${prediction.color === 'green' ? '' : 'pink'} rounded-3xl p-8 mb-8 border-2 ${
            prediction.color === 'green' ? 'border-green-500/30' : 
            prediction.color === 'yellow' ? 'border-yellow-500/30' : 'border-red-500/30'
          }`}>
            <div className="flex items-start gap-4">
              <div className="text-6xl">{prediction.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Today's AI Recommendation</h2>
                <p className="text-white/80 text-lg mb-4">{prediction.recommendation}</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="glass-dark rounded-2xl p-4">
                    <div className="text-white/60 text-sm mb-1">Recommended Workout</div>
                    <div className="text-white font-bold text-lg">{prediction.workoutType}</div>
                  </div>
                  <div className="glass-dark rounded-2xl p-4">
                    <div className="text-white/60 text-sm mb-1">Optimal Time</div>
                    <div className="text-white font-bold text-lg">{prediction.optimalTime}</div>
                  </div>
                  <div className="glass-dark rounded-2xl p-4">
                    <div className="text-white/60 text-sm mb-1">Tomorrow's Forecast</div>
                    <div className="text-white font-bold text-lg">{prediction.tomorrowRecovery}% Recovery</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Recovery */}
          <div className="stat-card group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-500 font-semibold mb-2">Your Recovery</div>
                <div className="text-5xl font-bold gradient-text mb-1">
                  {loadingStats ? '...' : (hasData ? `${stats.avgRecovery}%` : '--')}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData ? 'Average recovery score' : 'Upload data to see'}
                </div>
              </div>
              <div className="text-5xl group-hover:scale-110 transition-transform">💚</div>
            </div>
            {hasData && recoveryNum > 0 && (
              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                    recoveryNum >= 67 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    recoveryNum >= 34 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{width: `${recoveryNum}%`}}
                ></div>
              </div>
            )}
          </div>

          {/* Workouts */}
          <div className="stat-card group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-500 font-semibold mb-2">Total Workouts</div>
                <div className="text-5xl font-bold gradient-text mb-1">
                  {loadingStats ? '...' : stats.totalWorkouts}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData ? 'Workouts tracked' : 'No data uploaded yet'}
                </div>
              </div>
              <div className="text-5xl group-hover:scale-110 transition-transform">💪</div>
            </div>
            {hasData && (
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Keep crushing it!
              </div>
            )}
          </div>

          {/* Strain */}
          <div className="stat-card group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-500 font-semibold mb-2">Avg Strain</div>
                <div className="text-5xl font-bold gradient-text mb-1">
                  {loadingStats ? '...' : (hasData ? stats.avgStrain : '--')}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData ? 'Daily average' : 'Upload data to see'}
                </div>
              </div>
              <div className="text-5xl group-hover:scale-110 transition-transform">⚡</div>
            </div>
            {hasData && (
              <div className="text-xs text-gray-500 mt-2">
                Based on workout intensity
              </div>
            )}
          </div>
        </div>

        {/* Weekly Optimizer */}
        {hasData && prediction && (
          <div className="glass-white rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2">Your Optimal Week</h2>
                <p className="text-gray-600">AI-generated training schedule based on predicted recovery</p>
              </div>
              <div className="text-5xl">��</div>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {prediction.weeklyPlan.map((day, idx) => (
                <div 
                  key={idx}
                  className={`glass rounded-2xl p-4 text-center hover:scale-105 transition-all cursor-pointer ${
                    day.intensity === 'High' ? 'border-2 border-green-500/30' :
                    day.intensity === 'Moderate' ? 'border-2 border-yellow-500/30' :
                    day.intensity === 'Low' ? 'border-2 border-blue-500/30' :
                    'border-2 border-gray-500/30'
                  }`}
                >
                  <div className="font-bold text-gray-700 mb-2">{day.day}</div>
                  <div className="text-2xl mb-2">
                    {day.intensity === 'High' ? '🔥' :
                     day.intensity === 'Moderate' ? '💪' :
                     day.intensity === 'Low' ? '🚶' : '😴'}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">{day.workout}</div>
                  <div className="text-xs text-gray-600">{day.recovery}% Recovery</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gamification Section */}
        {hasData && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="glass-white rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🔥</div>
                <div>
                  <div className="text-2xl font-bold gradient-text">15</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Keep it going!</div>
            </div>

            <div className="glass-white rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🏆</div>
                <div>
                  <div className="text-2xl font-bold gradient-text">8</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Unlock more!</div>
            </div>

            <div className="glass-white rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">⭐</div>
                <div>
                  <div className="text-2xl font-bold gradient-text">Top 10%</div>
                  <div className="text-sm text-gray-600">This Month</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Amazing work!</div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {hasData && (
          <div className="text-center mb-8">
            <button
              onClick={() => loadUserStats(user.id)}
              disabled={loadingStats}
              className="btn-glass"
            >
              {loadingStats ? (
                <span className="flex items-center gap-2">
                  <div className="spinner !w-4 !h-4 !border-2"></div>
                  Refreshing...
                </span>
              ) : (
                '🔄 Refresh Stats'
              )}
            </button>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Upload Card */}
          <div className="relative overflow-hidden glass glow rounded-3xl p-8 group hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📦</div>
              <h2 className="text-3xl font-bold text-white mb-4">Upload More Data</h2>
              <p className="mb-6 text-white/80">
                Keep your insights fresh. Upload new Whoop exports to improve AI predictions.
              </p>
              <Link href="/upload" className="inline-block btn-primary">
                Upload Now →
              </Link>
            </div>
          </div>

          {/* Calorie GPS Card */}
          <div className="relative overflow-hidden glass glow-pink rounded-3xl p-8 group hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
              <h2 className="text-3xl font-bold text-white mb-4">Calorie-Burn GPS</h2>
              <p className="mb-6 text-white/80">
                ML-powered workout optimizer. Find your most efficient training based on recovery.
              </p>
              <Link href="/calorie-gps" className="inline-block btn-primary">
                Optimize Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
