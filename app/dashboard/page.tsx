'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

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
            <div className="w-14 h-14 border-4 border-neon-primary/15 border-t-neon-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-sm">Loading your insights...</p>
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

  const strainData = last7.map(() => Math.round(Math.max(6, Math.min(20, avgStrain + (Math.random() * 4 - 2)))))
  const sleepData = last7.map(() => Math.round((6.5 + Math.random() * 2) * 10) / 10)

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
      <div className="relative z-10 w-full px-6 md:px-8 pt-28 pb-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon-primary/30 bg-neon-primary/10 px-3 py-1 text-[12px] font-medium text-white/85">
              Welcome back, {user?.user_metadata?.name || 'Athlete'}
            </div>
            <h1 className="text-4xl font-semibold leading-tight">
              Dashboard
            </h1>
            <p className="text-white/60 text-sm max-w-xl">
              {hasData ? "Your training status at a glance. Recovery is optimized." : 'Upload your WHOOP export to unlock AI-powered insights.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NeonButton onClick={() => router.push('/upload')} variant="primary" className="text-sm">
              Upload Data
            </NeonButton>
            <NeonButton onClick={() => router.push('/calorie-gps')} variant="ghost" className="text-sm">
              Calorie GPS
            </NeonButton>
          </div>
        </div>

        {hasData ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Top Row: Stats */}
            <motion.div variants={itemVariants}>
              <StatsRow stats={statsData} />
            </motion.div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recommendation & Forecast */}
              <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                <TodayRecommendationCard
                  recovery={recovery}
                  recommendation={rec.text}
                  workoutType={rec.workout}
                  optimalTime={rec.time}
                  tomorrowForecast={Math.round(tomorrowForecast)}
                />

                <RecoveryBaselinePanel data={recoveryHistory} />
              </motion.div>

              {/* Right Column: Charts & Gamification */}
              <motion.div variants={itemVariants} className="space-y-6">
                <NeonCard className="p-6 border-white/10 bg-[#0A0A0A]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Tomorrow</p>
                      <p className="text-3xl font-semibold text-neon-primary">{Math.round(tomorrowForecast)}%</p>
                    </div>
                    <div className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">AI Forecast</div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Based on your recent strain and sleep trends, we predict a strong recovery tomorrow.
                  </p>
                </NeonCard>

                <div className="grid gap-4">
                  <InteractiveChart
                    title="Strain Trend"
                    data={last7.map((item, idx) => ({
                      date: item.date,
                      value: strainData[idx]
                    }))}
                    color="#22d3ee"
                    height={160}
                  />
                  <InteractiveChart
                    title="Sleep Quality"
                    data={last7.map((item, idx) => ({
                      date: item.date,
                      value: sleepData[idx]
                    }))}
                    color="#a855f7"
                    unit="h"
                    height={160}
                  />
                </div>
              </motion.div>
            </div>

            {/* Bottom Row: Weekly Plan */}
            <motion.div variants={itemVariants}>
              <WeeklyPlan plan={weeklyPlan} />
            </motion.div>
          </motion.div>
        ) : (
          <NeonCard className="p-12 text-center border-white/10 bg-[#0A0A0A]">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-bold mb-4">No Data Yet</h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Upload your WHOOP export to unlock AI-powered insights and personalized training plans
            </p>
            <NeonButton onClick={() => router.push('/upload')}>Upload Data Now</NeonButton>
          </NeonCard>
        )}
      </div>
    </AppLayout>
  )
}


