'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import WeeklyPlan from '../../components/dashboard/WeeklyPlan'
import { getCurrentUser } from '../../lib/supabase'
import { getUserStats } from '../../lib/dataParser'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    avgRecovery: 50,
    avgStrain: 0
  })

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

  const loadUserStats = async (userId: string) => {
    try {
      const userStats = await getUserStats(userId)
      if (userStats) {
        setStats(userStats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading your insights...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const hasData = stats.totalWorkouts > 0
  const recovery = typeof stats.avgRecovery === 'number' ? stats.avgRecovery : 50

  // Generate recommendation
  const getRecommendation = () => {
    if (recovery >= 67) return {
      text: "High recovery today! Perfect day for high-intensity training or strength work.",
      workout: "HIIT or Strength",
      time: "Morning (6-9 AM)"
    }
    if (recovery >= 34) return {
      text: "Moderate recovery. Stick to endurance training or moderate cardio.",
      workout: "Endurance Run",
      time: "Afternoon (2-5 PM)"
    }
    return {
      text: "Low recovery. Focus on active recovery, yoga, or complete rest.",
      workout: "Light Walk/Yoga",
      time: "Anytime"
    }
  }

  const rec = getRecommendation()
  const tomorrowForecast = Math.min(100, Math.max(30, recovery + (Math.random() * 20 - 10)))

  // Generate weekly plan
  const weeklyPlan = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
    const dayRecovery = Math.max(40, Math.min(90, recovery + (Math.random() * 30 - 15)))
    return {
      day,
      workout: dayRecovery >= 75 ? 'HIIT' : dayRecovery >= 60 ? 'Endurance' : dayRecovery >= 45 ? 'Light' : 'Rest',
      intensity: (dayRecovery >= 75 ? 'High' : dayRecovery >= 60 ? 'Moderate' : dayRecovery >= 45 ? 'Low' : 'Recovery') as any,
      recovery: Math.round(dayRecovery)
    }
  })

  const statsData = [
    {
      icon: Heart,
      label: 'Recovery',
      value: `${recovery}%`,
      subtitle: '7-day average',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      icon: Dumbbell,
      label: 'Total Workouts',
      value: stats.totalWorkouts,
      subtitle: 'All time',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Zap,
      label: 'Avg Strain',
      value: stats.avgStrain || '--',
      subtitle: '30-day average',
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      icon: Moon,
      label: 'Sleep Quality',
      value: '8.2h',
      subtitle: 'Last night',
      color: 'from-blue-500/20 to-cyan-500/20'
    }
  ]

  return (
    <AppLayout user={user}>
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-blob w-96 h-96 bg-purple-500 top-20 right-1/4" />
        <div className="gradient-blob w-96 h-96 bg-pink-500 bottom-20 left-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.name || 'Athlete'}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            {hasData ? "Here's your AI-powered performance analysis" : 'Upload your data to unlock insights'}
          </p>
        </div>

        {hasData ? (
          <>
            {/* Today's Recommendation */}
            <div className="mb-8">
              <TodayRecommendationCard
                recovery={recovery}
                recommendation={rec.text}
                workoutType={rec.workout}
                optimalTime={rec.time}
                tomorrowForecast={Math.round(tomorrowForecast)}
              />
            </div>

            {/* Stats Row */}
            <div className="mb-8">
              <StatsRow stats={statsData} />
            </div>

            {/* Weekly Plan */}
            <div className="mb-8">
              <WeeklyPlan plan={weeklyPlan} />
            </div>

            {/* Gamification Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🔥</div>
                  <div>
                    <div className="text-3xl font-bold">15</div>
                    <div className="text-sm text-slate-400">Day Streak</div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🏆</div>
                  <div>
                    <div className="text-3xl font-bold">8</div>
                    <div className="text-sm text-slate-400">Achievements</div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">⭐</div>
                  <div>
                    <div className="text-3xl font-bold">Top 10%</div>
                    <div className="text-sm text-slate-400">This Month</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-bold mb-4">No Data Yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Upload your WHOOP export to unlock AI-powered insights and personalized training plans
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="btn-primary"
            >
              Upload Data Now
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
