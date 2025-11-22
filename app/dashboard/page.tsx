'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon, ArrowDown } from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
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

// Typewriter Animation Component
function TypewriterText({ words }: { words: string[] }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[currentWordIndex]
    const typingSpeed = isDeleting ? 50 : 100
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1))
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        // Deleting backward
        if (displayedText.length > 0) {
          setDisplayedText(currentWord.slice(0, displayedText.length - 1))
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [displayedText, isDeleting, currentWordIndex, words])

  return (
    <span className="inline-block">
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block ml-1"
      >
        |
      </motion.span>
    </span>
  )
}

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const [personalizationInsights, setPersonalizationInsights] = useState<any[]>([])
  const { scrollY } = useScroll()
  const scrollOpacity = useTransform(scrollY, [0, 100], [1, 0])
  const isMobile = useIsMobile()

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
      const [summaryData, trendsData, personalizationData] = await Promise.all([
        api.getDashboardSummary(),
        api.getTrends(),
        api.getPersonalizationInsights().catch(() => []) // Gracefully handle if not available
      ])
      console.log('Dashboard Data Loaded:', { summaryData, trendsData, personalizationData })
      console.log('Personalization Insights:', personalizationData)
      
      // Check for recovery velocity insight
      const recoveryVelocityInsight = personalizationData?.find((insight: any) => insight.insight_type === 'recovery_velocity')
      if (recoveryVelocityInsight) {
        console.log('Recovery Velocity Insight Found:', recoveryVelocityInsight)
      } else {
        console.log('Recovery Velocity Insight Not Found in:', personalizationData)
      }
      setSummary(summaryData)
      setTrends(trendsData)
      setPersonalizationInsights(personalizationData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize all data transformations BEFORE early return (Rules of Hooks)
  const hasData = useMemo(() => {
    return summary && trends && trends.series && trends.series.recovery && trends.series.recovery.length > 0
  }, [summary, trends])

  // Memoize all data transformations to prevent recalculation on every render
  const recoveryData = useMemo(() => 
    trends?.series?.recovery?.slice(-30).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      recovery: item.value
    })) || [],
    [trends?.series?.recovery]
  )

  const last7Recovery = useMemo(() =>
    trends?.series?.recovery?.slice(-7).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value
    })) || [],
    [trends?.series?.recovery]
  )

  const last30Strain = useMemo(() =>
    trends?.series?.strain?.slice(-30).map((item: any) => {
      const date = new Date(item.date)
      const day = date.getDate()
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
      return {
        date: isMobile ? `${day}` : `${day}/ ${weekday}`,
        value: item.value
      }
    }) || [],
    [trends?.series?.strain, isMobile]
  )

  const last30Sleep = useMemo(() =>
    trends?.series?.sleep?.slice(-30).map(d => {
      const date = new Date(d.date)
      const day = date.getDate()
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
      return {
        date: isMobile ? `${day}` : `${day}/ ${weekday}`,
        value: d.value || 0
      }
    }) || [],
    [trends?.series?.sleep, isMobile]
  )

  const last7Strain = useMemo(() =>
    trends?.series?.strain?.slice(-7).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: item.value
    })) || [],
    [trends?.series?.strain]
  )

  const last7Sleep = useMemo(() =>
    trends?.series?.sleep?.slice(-7).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value || 0
    })) || [],
    [trends?.series?.sleep]
  )

  const last7SpO2 = useMemo(() =>
    trends?.series?.spo2?.slice(-7).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value || 0
    })) || [],
    [trends?.series?.spo2]
  )

  const last7SkinTemp = useMemo(() =>
    trends?.series?.skin_temp?.slice(-7).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value || 0
    })) || [],
    [trends?.series?.skin_temp]
  )

  const last7RHR = useMemo(() =>
    trends?.series?.resting_hr?.slice(-7).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value || 0
    })) || [],
    [trends?.series?.resting_hr]
  )

  const last7RespRate = useMemo(() =>
    trends?.series?.respiratory_rate?.slice(-7).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.value || 0
    })) || [],
    [trends?.series?.respiratory_rate]
  )

  // Get yesterday's strain from trends data (second to last item)
  const yesterdayStrain = useMemo(() =>
    trends?.series?.strain && trends.series.strain.length >= 2
      ? trends.series.strain[trends.series.strain.length - 2]?.value
      : null,
    [trends?.series?.strain]
  )

  const statsData = useMemo(() => [
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
      value: yesterdayStrain !== null && yesterdayStrain !== undefined ? yesterdayStrain.toFixed(1) : '--',
      subtitle: 'YESTERDAY',
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
  ], [summary, yesterdayStrain])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-neon-primary/15 border-t-neon-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-white/60 text-sm">Loading your insights...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <TranscendentalBackground />

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ opacity: scrollOpacity }}
        transition={{ delay: 2, duration: 1 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-gray-400 dark:text-white/20 animate-bounce"
        layout={false}
      >
        <ArrowDown className="w-6 h-6" />
      </motion.div>

      <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 pt-16 md:pt-20 lg:pt-24">

        {/* Section 1: Hero / Overview */}
        <ParallaxSection
          stickyPosition="top"
          stickyContent={
            <div className="w-full pb-4 md:pb-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 md:space-y-6">
                <div className="text-xs md:text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-white/60 font-medium">
                  WELCOME BACK,
                </div>
                <div className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white leading-none min-h-[1.2em]">
                  <TypewriterText 
                    words={[
                      (user?.user_metadata?.name?.split(' ')[0] || 'ATHLETE').toUpperCase(),
                      'SUPERHUMAN',
                      'UNSTOPPABLE'
                    ]} 
                  />
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight text-gray-900 dark:text-white">
              Today's Overview
            </h1>
            {hasData ? (
              <StatsRow stats={statsData} />
            ) : (
              <NeonCard className="p-12 text-center border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A]">
                <div className="text-6xl mb-6">📦</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">No Data Yet</h3>
                <p className="text-gray-600 dark:text-white/60 mb-8 max-w-md mx-auto">
                  Upload your WHOOP export to unlock AI-powered insights and personalized training plans
                </p>
                <NeonButton onClick={() => router.push('/upload')}>Upload Data Now</NeonButton>
              </NeonCard>
            )}
          </div>
        </ParallaxSection>

        {hasData && (
          <>
            {/* Section 2: AI Coaching */}
            <ParallaxSection
              stickyPosition="left"
              stickyContent={
                <div className="space-y-3 md:space-y-4 w-full">
                  <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">AI Coach</p>
                        <p className="text-3xl font-semibold text-neon-primary mt-1">
                          {summary?.recommendation?.focus || "General Wellness"}
                        </p>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-white/60 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                        FOCUS
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                      Your personalized daily briefing. We analyze your recovery, sleep, and strain to recommend the perfect plan for today.
                    </p>
                  </NeonCard>
                </div>
              }
            >
              <div className="flex flex-col gap-4 md:gap-6">
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
                <div className="space-y-2 md:space-y-4 text-left md:text-right">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Recovery Trends</h2>
                  <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-white/60 leading-relaxed hidden md:block">
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

            {/* Section 5: Personalization Insights */}
            <ParallaxSection
              stickyPosition="left"
              stickyContent={
                <div className="space-y-2 md:space-y-4">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">AI Personalization</h2>
                  <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-white/60 leading-relaxed hidden md:block">
                    Machine learning insights tailored to your unique physiology. These recommendations improve as you add more data.
                  </p>
                </div>
              }
            >
              {personalizationInsights.length > 0 ? (
                <div className="grid gap-6">
                  {personalizationInsights.map((insight, idx) => (
                    <NeonCard
                      key={idx}
                      className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-2">
                            {insight.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                        {insight.confidence && (
                          <span className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider bg-blue-500/20 text-blue-400">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      {insight.data?.safe_threshold && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                          <div className="text-xs uppercase tracking-wider text-amber-400 mb-1">Safe Strain Threshold</div>
                          <div className="text-2xl font-bold text-amber-300">{insight.data.safe_threshold.toFixed(1)}</div>
                          {insight.data.risk_increase_pct && (
                            <div className="text-xs text-amber-400/80 mt-1">
                              Risk increases by {Math.abs(insight.data.risk_increase_pct).toFixed(0)}% when exceeded
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Historical Examples */}
                      {insight.data?.examples && insight.data.examples.length > 0 && (
                        <div className="mt-6">
                          <div className="text-sm font-semibold text-gray-700 dark:text-white/90 mb-3">
                            Why {insight.data.safe_threshold.toFixed(1)}? Evidence from your data:
                          </div>
                          <div className="space-y-3">
                            {insight.data.examples.map((example: any, exIdx: number) => {
                              const isGood = example.type === 'good'
                              const dateObj = new Date(example.date)
                              const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                              })
                              
                              return (
                                <div
                                  key={exIdx}
                                  className={`p-3 rounded-lg border ${
                                    isGood
                                      ? 'bg-green-500/10 border-green-500/20'
                                      : 'bg-red-500/10 border-red-500/20'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${
                                        isGood ? 'bg-green-400' : 'bg-red-400'
                                      }`} />
                                      <div>
                                        <div className="text-xs text-gray-500 dark:text-white/50">
                                          {formattedDate}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-white/80 mt-0.5">
                                          {example.message}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                                      isGood
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {isGood ? '✓ Good' : '⚠ Risk'}
                                    </div>
                                  </div>
                                  {isGood ? (
                                    <div className="text-xs text-green-400/80 mt-2 ml-5">
                                      Staying below threshold maintained strong recovery
                                    </div>
                                  ) : (
                                    <div className="text-xs text-red-400/80 mt-2 ml-5">
                                      Exceeding threshold led to recovery drop
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Recovery Velocity Display */}
                      {insight.insight_type === 'recovery_velocity' && (
                        <>
                          {insight.data.days_to_recover ? (
                            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs uppercase tracking-wider text-blue-400">Recovery Timeline</div>
                                <div className="text-2xl font-bold text-blue-300">
                                  {insight.data.days_to_recover.toFixed(1)} {insight.data.days_to_recover === 1 ? 'day' : 'days'}
                                </div>
                              </div>
                              <div className="text-xs text-blue-400/80 mt-1">
                                From {insight.data.current_recovery?.toFixed(0) || 'current'}% to 67% recovery
                              </div>
                              {insight.data.strain_score >= 12 && (
                                <div className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>High strain day detected - recovery may take longer</span>
                                </div>
                              )}
                            </div>
                          ) : insight.data.recovery_high ? (
                            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs uppercase tracking-wider text-green-400">Current Status</div>
                                <div className="text-2xl font-bold text-green-300">
                                  {insight.data.current_recovery?.toFixed(0) || 'N/A'}%
                                </div>
                              </div>
                              <div className="text-xs text-green-400/80 mt-1">
                                You're in good recovery! This model predicts how fast you recover from low recovery states.
                              </div>
                            </div>
                          ) : null}

                          {/* How We Calculated This */}
                          {insight.data.model_metadata && (
                            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20">
                              <div className="text-xs uppercase tracking-wider text-purple-400 mb-3">How We Calculated This</div>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <div className="text-xs text-purple-300/80 mt-0.5">Method:</div>
                                  <div className="text-sm font-medium text-gray-700 dark:text-white/80 flex-1">
                                    {insight.data.model_metadata.method || 'ML Model'}
                                  </div>
                                </div>
                                {insight.data.model_metadata.features && insight.data.model_metadata.features.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-xs text-purple-300/80 mb-2">Features Used:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {insight.data.model_metadata.features.map((feature: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                        >
                                          {feature}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {insight.data.model_metadata.sample_size && (
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-500/20">
                                    <div className="text-xs text-purple-300/80">Based on:</div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-white/80">
                                      {insight.data.model_metadata.sample_size} historical recovery episodes
                                    </div>
                                  </div>
                                )}
                                {insight.data.model_metadata.r2_score && (
                                  <div className="text-xs text-purple-300/60 mt-2">
                                    Model accuracy (R²): {(insight.data.model_metadata.r2_score * 100).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Previous Instances */}
                          {insight.data.examples && insight.data.examples.length > 0 && (
                            <div className="mt-4">
                              <div className="text-sm font-semibold text-gray-700 dark:text-white/90 mb-3">
                                Previous Recovery Instances
                              </div>
                              <div className="space-y-3">
                                {insight.data.examples.map((example: any, exIdx: number) => {
                                  const dateObj = new Date(example.date)
                                  const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                  })
                                  
                                  return (
                                    <div
                                      key={exIdx}
                                      className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                          <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className="text-xs text-gray-500 dark:text-white/50">
                                                {formattedDate}
                                              </div>
                                              {example.strain >= 12 && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                  High Strain
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1">
                                              {example.message || `Recovered from ${example.start_recovery?.toFixed(0)}% to ${example.end_recovery?.toFixed(0)}% in ${example.days_taken} day${example.days_taken > 1 ? 's' : ''}`}
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-blue-400/80">
                                              <span>Start: {example.start_recovery?.toFixed(0)}%</span>
                                              <span>→</span>
                                              <span>End: {example.end_recovery?.toFixed(0)}%</span>
                                              <span className="text-blue-300 font-medium">{example.days_taken} day{example.days_taken > 1 ? 's' : ''}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </NeonCard>
                  ))}
                </div>
              ) : (
                <NeonCard className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-2">
                      AI Personalization Insights
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
                      Personalized insights will appear here as we analyze your data patterns.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      You need at least 21 days of data for Recovery Velocity predictions.
                    </p>
                  </div>
                </NeonCard>
              )}
            </ParallaxSection>

            {/* Section 6: Health Monitor */}
            <ParallaxSection
              stickyPosition="top"
              stickyContent={
                <div className="mb-4 md:mb-6 lg:mb-8">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white text-center">Health Monitor</h2>
                  <p className="text-gray-600 dark:text-white/60 text-center mt-1.5 md:mt-2 text-xs md:text-sm lg:text-base hidden md:block">Key vital signs at a glance.</p>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
