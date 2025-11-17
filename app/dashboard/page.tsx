'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import WeeklyPlan from '../../components/dashboard/WeeklyPlan'
import RecoveryBaselinePanel from '../../components/dashboard/RecoveryBaselinePanel'
import InteractiveChart from '../../components/dashboard/InteractiveChart'
import NeonButton from '../../components/ui/NeonButton'
import NeonCard from '../../components/ui/NeonCard'
import { ParallaxBackground } from '../../components/ui/ParallaxBlob'
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
        <div className="flex items-center justify-center min-h-screen bg-[#050505]">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-neon-primary/15 border-t-neon-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading your insights...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const hasData = stats.totalWorkouts > 0
  const recovery = typeof stats.avgRecovery === 'number' ? stats.avgRecovery : 50
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const recoveryHistory = Array.from({ length: 14 }).map((_, idx) => {
    const baseline = Math.max(45, Math.min(88, recovery + (Math.random() * 14 - 7)))
    const label = dayLabels[idx % dayLabels.length]
    return { date: label, recovery: Math.round(baseline) }
  })
  const last7 = recoveryHistory.slice(-7)
  const avgStrain = typeof stats.avgStrain === 'number' ? stats.avgStrain : Number(stats.avgStrain) || 10
  
  // Generate consistent data for charts (using useMemo would be better, but keeping it simple for now)
  const strainData = last7.map(() => Math.round(Math.max(6, Math.min(20, avgStrain + (Math.random() * 4 - 2)))))
  const sleepData = last7.map(() => Math.round((6.5 + Math.random() * 2) * 10) / 10)

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
      <ParallaxBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-3 pt-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-neon-primary/30 bg-neon-primary/10 px-3 py-1 text-[12px] font-medium text-white/85">
            Welcome back, {user?.user_metadata?.name || 'Athlete'}
          </div>
          <h1 className="text-[clamp(2.2rem,4vw,3rem)] font-semibold leading-tight">
            Futuristic, neon-clear insights built on your WHOOP data.
          </h1>
          <p className="text-white/60 text-[15px]">
            {hasData ? "Recovery driven cards, adaptive baselines, and micro-motions tuned for performance." : 'Upload your WHOOP export to unlock AI-powered insights and personalized training plans.'}
          </p>
          <div className="flex items-center gap-3">
            <NeonButton onClick={() => router.push('/upload')} variant="primary" className="text-sm">
              Upload new data
            </NeonButton>
            <NeonButton onClick={() => router.push('/calorie-gps')} variant="ghost" className="text-sm">
              Calorie GPS
            </NeonButton>
          </div>
        </div>

        {hasData ? (
          <>
            {/* Recovery + recommendation */}
            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6">
              <TodayRecommendationCard
                recovery={recovery}
                recommendation={rec.text}
                workoutType={rec.workout}
                optimalTime={rec.time}
                tomorrowForecast={Math.round(tomorrowForecast)}
              />
              <NeonCard className="p-6 border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Tomorrow forecast</p>
                    <p className="text-3xl font-semibold text-neon-primary">{Math.round(tomorrowForecast)}%</p>
                  </div>
                  <div className="text-xs text-white/60">AI forecast (demo)</div>
                </div>
                <p className="text-sm text-white/70">
                  Baseline-conscious forecasts that mirror your slider changes. Values above baseline glow green; below baseline run red and pull back intensity.
                </p>
              </NeonCard>
            </div>

            {/* Baseline-aware metrics */}
            <RecoveryBaselinePanel data={recoveryHistory} />

            {/* Stats Row */}
            <StatsRow stats={statsData} />

            {/* Separate Interactive Charts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Recent 7 days</p>
                  <h3 className="text-xl font-semibold">Interactive metrics</h3>
                </div>
                <span className="text-[12px] text-white/60">Hover to see values</span>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <InteractiveChart
                  title="Recovery"
                  subtitle="7-day trend"
                  data={last7.map((item, idx) => ({ date: item.date, value: item.recovery }))}
                  color="#00FF8F"
                  unit="%"
                  height={200}
                />
                <InteractiveChart
                  title="Strain"
                  subtitle="7-day trend"
                  data={last7.map((item, idx) => ({ 
                    date: item.date, 
                    value: strainData[idx] 
                  }))}
                  color="#22d3ee"
                  unit=""
                  height={200}
                />
                <InteractiveChart
                  title="Sleep"
                  subtitle="7-day trend"
                  data={last7.map((item, idx) => ({ 
                    date: item.date, 
                    value: sleepData[idx] 
                  }))}
                  color="#a855f7"
                  unit="h"
                  height={200}
                />
              </div>
            </div>

            {/* Weekly Plan */}
            <WeeklyPlan plan={weeklyPlan} />

            {/* Gamification Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <NeonCard className="p-6 border-white/10">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🔥</div>
                  <div>
                    <div className="text-3xl font-bold">15</div>
                    <div className="text-sm text-slate-400">Day Streak</div>
                  </div>
                </div>
              </NeonCard>
              <NeonCard className="p-6 border-white/10">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🏆</div>
                  <div>
                    <div className="text-3xl font-bold">8</div>
                    <div className="text-sm text-slate-400">Achievements</div>
                  </div>
                </div>
              </NeonCard>
              <NeonCard className="p-6 border-white/10">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">⭐</div>
                  <div>
                    <div className="text-3xl font-bold">Top 10%</div>
                    <div className="text-sm text-slate-400">This Month</div>
                  </div>
                </div>
              </NeonCard>
            </div>
          </>
        ) : (
          <NeonCard className="p-12 text-center border-white/10">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-bold mb-4">No Data Yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Upload your WHOOP export to unlock AI-powered insights and personalized training plans
            </p>
            <NeonButton onClick={() => router.push('/upload')}>Upload Data Now</NeonButton>
          </NeonCard>
        )}
      </div>
    </AppLayout>
  )
}

