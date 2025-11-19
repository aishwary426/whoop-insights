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
import { api } from '../../lib/api'
import { getCurrentUser } from '../../lib/supabase'

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
  const [summary, setSummary] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      loadDashboardData(currentUser.id)
    }
  }

  const loadDashboardData = async (userId: string) => {
    try {
      const [summaryData, trendsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getTrends()
      ])
      setSummary(summaryData)
      setTrends(trendsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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

  const hasData = summary && trends && trends.series && trends.series.recovery.length > 0

  // Format data for charts
  const last7Recovery = trends?.series?.recovery.slice(-7).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    recovery: item.value
  })) || []

  const last7Strain = trends?.series?.strain.slice(-7).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: item.value
  })) || []

  const last7Sleep = trends?.series?.sleep.slice(-7).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: item.value
  })) || []

  const statsData = [
    {
      icon: Heart,
      label: 'Recovery',
      value: summary?.today?.recovery_score ? `${Math.round(summary.today.recovery_score)}%` : '--',
      subtitle: 'Today',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      icon: Dumbbell,
      label: 'Strain',
      value: summary?.today?.strain_score ? summary.today.strain_score.toFixed(1) : '--',
      subtitle: 'Today',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Zap,
      label: 'HRV',
      value: summary?.today?.hrv ? `${Math.round(summary.today.hrv)} ms` : '--',
      subtitle: 'Today',
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      icon: Moon,
      label: 'Sleep',
      value: summary?.today?.sleep_hours ? `${summary.today.sleep_hours.toFixed(1)}h` : '--',
      subtitle: 'Last night',
      color: 'from-blue-500/20 to-cyan-500/20'
    }
  ]

  // Generate weekly plan from trends
  const weeklyPlan = last7Recovery.map((item: any) => {
    const recovery = item.recovery
    return {
      day: item.date,
      workout: recovery >= 67 ? 'High Intensity' : recovery >= 34 ? 'Moderate' : 'Active Recovery',
      intensity: (recovery >= 67 ? 'High' : recovery >= 34 ? 'Moderate' : 'Recovery') as any,
      recovery: Math.round(recovery)
    }
  })

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
              {hasData ? "Your training status at a glance. AI insights ready." : 'Upload your WHOOP export to unlock AI-powered insights.'}
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
                  recovery={summary?.today?.recovery_score || 0}
                  recommendation={summary?.recommendation?.notes || "No recommendation available."}
                  workoutType={summary?.recommendation?.workout_type || "Rest"}
                  optimalTime={summary?.recommendation?.optimal_time || "Anytime"}
                  tomorrowForecast={Math.round(summary?.tomorrow?.recovery_forecast || 50)}
                  calories={summary?.recommendation?.calories}
                />

                <RecoveryBaselinePanel data={last7Recovery} />
              </motion.div>

              {/* Right Column: Charts & Gamification */}
              <motion.div variants={itemVariants} className="space-y-6">
                <NeonCard className="p-6 border-white/10 bg-[#0A0A0A]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Tomorrow</p>
                      <p className="text-3xl font-semibold text-neon-primary">
                        {Math.round(summary?.tomorrow?.recovery_forecast || 0)}%
                      </p>
                    </div>
                    <div className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">AI Forecast</div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {(summary?.tomorrow?.recovery_forecast || 0) > 66
                      ? "Expect high recovery tomorrow. Good day to push."
                      : "Recovery might be lower tomorrow. Prioritize sleep."}
                  </p>
                </NeonCard>

                <div className="grid gap-4">
                  <InteractiveChart
                    title="Strain Trend"
                    data={last7Strain}
                    color="#22d3ee"
                    height={160}
                  />
                  <InteractiveChart
                    title="Sleep Quality"
                    data={last7Sleep}
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


