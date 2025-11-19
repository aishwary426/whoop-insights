"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import RecoveryBaselinePanel from '../../components/dashboard/RecoveryBaselinePanel'
import InteractiveChart from '../../components/dashboard/InteractiveChart'
import ForecastCard from '../../components/dashboard/ForecastCard'
import NeonButton from '../../components/ui/NeonButton'
import NeonCard from '../../components/ui/NeonCard'
import { ParallaxBackground } from '../../components/ui/ParallaxBlob'
import { api, type DashboardSummary, type TrendsResponse } from '../../lib/api'
import { getCurrentUser } from '../../lib/supabase'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [trends, setTrends] = useState<TrendsResponse | null>(null)

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
      console.log('Dashboard Data Loaded:', { summaryData, trendsData })
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

  const hasData = summary && trends && trends.series && trends.series.recovery && trends.series.recovery.length > 0

  // Format data for charts
  const recoveryData = trends?.series?.recovery?.slice(-30).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    recovery: item.value
  })) || []

  const last7Recovery = trends?.series?.recovery?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d.value
  })) || []

  const last7Strain = trends?.series?.strain?.slice(-7).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: item.value
  })) || []

  const last7Sleep = trends?.series?.sleep?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d.value || 0
  })) || []

  const last7SpO2 = trends?.series?.spo2?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d.value || 0
  })) || []

  const last7SkinTemp = trends?.series?.skin_temp?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d.value || 0
  })) || []

  const last7RHR = trends?.series?.resting_hr?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d.value || 0
  })) || []

  const last7RespRate = trends?.series?.respiratory_rate?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d.value || 0
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

  // Weekly plan logic removed

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
            animate="visible"
            className="space-y-6"
          >
            {/* Top Row: Stats */}
            <motion.div variants={itemVariants}>
              <StatsRow stats={statsData} />
            </motion.div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Row 1: Recommendation (8) + Forecast (4) */}
              <motion.div variants={itemVariants} className="lg:col-span-8 h-full">
                <TodayRecommendationCard
                  recovery={summary?.today?.recovery_score || 0}
                  recommendation={summary?.recommendation?.notes || "No recommendation available."}
                  workoutType={summary?.recommendation?.workout_type || "Rest"}
                  optimalTime={summary?.recommendation?.optimal_time || "Anytime"}
                  tomorrowForecast={Math.round(summary?.tomorrow?.recovery_forecast || 50)}
                  calories={summary?.recommendation?.calories}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
                <ForecastCard forecast={summary?.tomorrow?.recovery_forecast || 0} />
              </motion.div>

              {/* Row 2: Baseline Panel (8) + Trends Stack (4) */}
              <motion.div variants={itemVariants} className="lg:col-span-8">
                <RecoveryBaselinePanel data={recoveryData} />
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
                <InteractiveChart
                  title="Strain Trend"
                  data={last7Strain}
                  color="#22d3ee"
                  height="100%"
                  className="flex-1"
                />
                <InteractiveChart
                  title="Sleep Quality"
                  data={last7Sleep}
                  color="#a855f7"
                  unit="h"
                  height={160}
                  className="flex-1"
                />
              </motion.div>

              {/* Row 3: Health Monitor (SpO2, Skin Temp, RHR, Resp Rate) */}
              <motion.div variants={itemVariants} className="lg:col-span-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InteractiveChart
                  title="Blood Oxygen"
                  subtitle="SpO2 %"
                  data={last7SpO2}
                  color="#ef4444"
                  unit="%"
                  height={300}
                />
                <InteractiveChart
                  title="Skin Temp"
                  subtitle="Deviation (°C)"
                  data={last7SkinTemp}
                  color="#f97316"
                  unit="°C"
                  height={300}
                />
                <InteractiveChart
                  title="Resting HR"
                  subtitle="RHR (bpm)"
                  data={last7RHR}
                  color="#ec4899"
                  unit="bpm"
                  height={300}
                />
                <InteractiveChart
                  title="Resp. Rate"
                  subtitle="rpm"
                  data={last7RespRate}
                  color="#14b8a6"
                  unit="rpm"
                  height={300}
                />
              </motion.div>
            </div>

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


