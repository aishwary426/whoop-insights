'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon, ArrowDown } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import RecoveryBaselinePanel from '../../components/dashboard/RecoveryBaselinePanel'
import InteractiveChart from '../../components/dashboard/InteractiveChart'
import ForecastCard from '../../components/dashboard/ForecastCard'
import NeonButton from '../../components/ui/NeonButton'
import NeonCard from '../../components/ui/NeonCard'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'
import ParallaxSection from '../../components/ui/ParallaxSection'
import PerformanceSection from '../../components/dashboard/PerformanceSection'
import { api, type DashboardSummary, type TrendsResponse } from '../../lib/api'
import { getCurrentUser } from '../../lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const { scrollY } = useScroll()
  const scrollOpacity = useTransform(scrollY, [0, 100], [1, 0])

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

  const last30Strain = trends?.series?.strain?.slice(-30).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    value: item.value
  })) || []

  const last30Sleep = trends?.series?.sleep?.slice(-30).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    value: d.value || 0
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



  return (
    <AppLayout user={user}>
      <TranscendentalBackground />

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ opacity: scrollOpacity }}
        transition={{ delay: 2, duration: 1 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-white/20 animate-bounce"
      >
        <ArrowDown className="w-6 h-6" />
      </motion.div>

      <div className="relative z-10 w-full">

        {/* Section 1: Hero / Overview */}
        <ParallaxSection
          stickyPosition="top"
          stickyContent={
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-neon-primary/30 bg-neon-primary/10 px-3 py-1 text-[12px] font-medium text-white/85">
                  Welcome back, {user?.user_metadata?.name || 'Athlete'}
                </div>
                <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                  Today's Overview
                </h1>
                <p className="text-white/60 text-sm max-w-xl">
                  {hasData ? "Your daily snapshot. Scroll to explore your insights." : 'Upload your WHOOP export to unlock AI-powered insights.'}
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
          }
        >
          {hasData ? (
            <StatsRow stats={statsData} />
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
        </ParallaxSection>

        {hasData && (
          <>
            {/* Section 2: AI Coaching */}
            <ParallaxSection
              stickyPosition="left"
              stickyContent={
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-white">AI Coach</h2>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Your personalized daily briefing. We analyze your recovery, sleep, and strain to recommend the perfect plan for today.
                  </p>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Focus</div>
                    <div className="text-neon-primary font-medium">
                      {summary?.recommendation?.focus || "General Wellness"}
                    </div>
                  </div>
                </div>
              }
            >
              <div className="flex flex-col gap-6">
                <div className="h-full">
                  <TodayRecommendationCard
                    recovery={summary?.today?.recovery_score || 0}
                    recommendation={summary?.recommendation?.notes || "No recommendation available."}
                    workoutType={summary?.recommendation?.workout_type || "Rest"}
                    optimalTime={summary?.recommendation?.optimal_time || "Anytime"}
                    tomorrowForecast={Math.round(summary?.tomorrow?.recovery_forecast || 50)}
                    calories={summary?.recommendation?.calories}
                  />
                </div>
                <div className="h-full">
                  <ForecastCard
                    forecast={summary?.tomorrow?.recovery_forecast || 0}
                    strain={summary?.today?.strain_score || 0}
                    sleep={summary?.today?.sleep_hours || 0}
                  />
                </div>
              </div>
            </ParallaxSection>

            {/* Section 3: Recovery Trends */}
            <ParallaxSection
              stickyPosition="right"
              stickyContent={
                <div className="space-y-4 text-right">
                  <h2 className="text-3xl font-bold text-white">Recovery Trends</h2>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Visualizing your recovery baseline over the last 30 days. Spot patterns and adjust your lifestyle.
                  </p>
                </div>
              }
            >
              <RecoveryBaselinePanel data={recoveryData} />
            </ParallaxSection>

            {/* Section 4: Performance Metrics (Immersive) */}
            <div className="relative z-20">
              <PerformanceSection strainData={last30Strain} sleepData={last30Sleep} />
            </div>

            {/* Section 5: Health Monitor */}
            <ParallaxSection
              stickyPosition="top"
              stickyContent={
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white text-center">Health Monitor</h2>
                  <p className="text-white/60 text-center mt-2">Key vital signs at a glance.</p>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </ParallaxSection>
          </>
        )}
      </div>
    </AppLayout>
  )
}
