'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon, ArrowDown } from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import RecoveryBaselinePanel from '../../components/dashboard/RecoveryBaselinePanel'
import ForecastCard from '../../components/dashboard/ForecastCard'
import NeonButton from '../../components/ui/NeonButton'
import NeonCard from '../../components/ui/NeonCard'
import TranscendentalBackground from '../../components/ui/TranscendentalBackground'
import ParallaxSection from '../../components/ui/ParallaxSection'
import PerformanceSection from '../../components/dashboard/PerformanceSection'
import DashboardSkeleton, { PersonalizationInsightsSkeleton } from '../../components/dashboard/DashboardSkeleton'
import { api, type DashboardSummary, type TrendsResponse } from '../../lib/api'
import { getCurrentUser } from '../../lib/auth'

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
  const [loadingPersonalization, setLoadingPersonalization] = useState(true)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const { scrollY } = useScroll()
  const scrollOpacity = useTransform(scrollY, [0, 100], [1, 0])
  const isMobile = useIsMobile()

  useEffect(() => {
    checkUser()
  }, [])

  // Get view_user_id from URL params for admin viewing
  const getViewUserId = () => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const viewUserId = params.get('view_user_id')
    const isAdminView = params.get('admin_view') === 'true'
    return isAdminView && viewUserId ? viewUserId : null
  }

  // Safety timeout - if loading takes more than 30 seconds, stop loading
  useEffect(() => {
    if (!loading) return

    const timeoutId = setTimeout(() => {
      console.warn('Dashboard loading timeout after 30 seconds - stopping load')
      setLoading(false)
    }, 30000) // 30 second timeout

    return () => clearTimeout(timeoutId)
  }, [loading])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    // Check if admin is viewing another user's data
    const viewUserId = getViewUserId()
    if (viewUserId) {
      // Verify admin access
      if (currentUser.email?.toLowerCase() !== 'ctaishwary@gmail.com') {
        router.push('/')
        return
      }
      setUser(currentUser)
      setViewingUserId(viewUserId)
      loadDashboardData(viewUserId)
    } else {
      setUser(currentUser)
      setViewingUserId(null)
      loadDashboardData(currentUser.id)
    }
  }

  const loadDashboardData = async (userId: string, retryCount = 0) => {
    try {
      console.log(`Loading dashboard data (attempt ${retryCount + 1})...`)
      const startTime = Date.now()

      // Check if we're viewing another user's data (admin view)
      const viewUserId = getViewUserId()
      const targetUserId = viewUserId || userId

      // Load critical data first (summary and trends) - these are fast
      const [summaryData, trendsData] = await Promise.all([
        api.getDashboardSummary(targetUserId !== userId ? targetUserId : undefined),
        api.getTrends(undefined, undefined, targetUserId !== userId ? targetUserId : undefined)
      ])

      const criticalLoadTime = Date.now() - startTime
      console.log(`Critical Dashboard Data Loaded in ${criticalLoadTime}ms:`, {
        summary: summaryData ? '✓' : '✗',
        trends: trendsData ? '✓' : '✗',
        trendsRecoveryLength: trendsData?.series?.recovery?.length || 0
      })

      // Check if we have data
      const hasRecoveryData = trendsData?.series?.recovery && trendsData.series.recovery.length > 0
      const justUploaded = typeof window !== 'undefined' && window.location.search.includes('uploaded=')

      // Set critical data immediately so dashboard can render
      setSummary(summaryData)
      setTrends(trendsData)

      // Stop loading state early so user sees content faster
      // Personalization insights will load in background
      setLoading(false)

      // Load personalization insights in the background (these are slow due to ML models)
      // Don't block the UI for these
      setLoadingPersonalization(true)
      api.getPersonalizationInsights(targetUserId !== userId ? targetUserId : undefined)
        .then((personalizationData) => {
          console.log('Personalization insights loaded:', personalizationData?.length || 0)
          const recoveryVelocityInsight = personalizationData?.find((insight: any) => insight.insight_type === 'recovery_velocity')
          if (recoveryVelocityInsight) {
            console.log('Recovery Velocity Insight Found:', recoveryVelocityInsight)
          }
          setPersonalizationInsights(personalizationData || [])
          setLoadingPersonalization(false)
        })
        .catch((err) => {
          console.warn('Personalization insights not available:', err)
          setPersonalizationInsights([])
          setLoadingPersonalization(false)
        })

      // If we just uploaded and data is still empty, retry with increasing delays
      // Increase retry count to 5 and use longer delays to account for database commit propagation
      if (!hasRecoveryData && justUploaded && retryCount < 5) {
        const retryDelay = (retryCount + 1) * 3000 // 3s, 6s, 9s, 12s, 15s
        console.log(`No data found after upload (attempt ${retryCount + 1}/5), retrying in ${retryDelay / 1000} seconds...`)
        setTimeout(() => {
          loadDashboardData(userId, retryCount + 1)
        }, retryDelay)
        // Keep loading state during retry
        setLoading(true)
        return
      }

      if (!hasRecoveryData && justUploaded) {
        console.warn('Data still not available after retries. Backend processing may still be in progress.')
        console.log('Summary data:', summaryData)
        console.log('Trends data:', trendsData)
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        status: error?.status
      })

      // Always stop loading on error after max retries
      const justUploaded = typeof window !== 'undefined' && window.location.search.includes('uploaded=')
      if (retryCount < 5 && justUploaded) {
        const retryDelay = (retryCount + 1) * 3000 // 3s, 6s, 9s, 12s, 15s
        console.log(`Error loading data (attempt ${retryCount + 1}/5), retrying in ${retryDelay / 1000} seconds...`)
        setTimeout(() => {
          loadDashboardData(userId, retryCount + 1)
        }, retryDelay)
        // Keep loading state during retry
        return
      }

      // Stop loading and set empty state so UI shows "No Data" message
      setLoading(false)
      console.error('Failed to load dashboard data after retries. Showing "No Data" UI.')

      // Ensure we have null state so the "No Data" UI can show
      if (!summary) setSummary(null)
      if (!trends) setTrends(null)
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
      color: 'from-blue-600/20 dark:from-green-500/20 to-blue-500/20 dark:to-emerald-500/20'
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
      <AppLayout user={user}>
        <TranscendentalBackground />
        <DashboardSkeleton />
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
                <div className="text-xs md:text-sm uppercase tracking-[0.2em] text-blue-600 dark:text-neon-primary font-medium">
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
            {/* Admin View Banner */}
            {viewingUserId && (
              <NeonCard className="p-4 border-blue-500/30 bg-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👁️</span>
                    <div>
                      <p className="font-semibold text-blue-600 dark:text-neon-primary">Admin View Mode</p>
                      <p className="text-sm text-gray-600 dark:text-white/60">Viewing data for user: {viewingUserId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="px-4 py-2 text-sm bg-blue-600 dark:bg-neon-primary text-black dark:text-black rounded-lg hover:bg-blue-700 dark:hover:bg-neon-primary/90 transition-colors"
                  >
                    Back to Users
                  </button>
                </div>
              </NeonCard>
            )}
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
                        <p className="text-3xl font-semibold text-blue-600 dark:text-neon-primary mt-1">
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
              <div data-chart="recovery-baseline">
                <RecoveryBaselinePanel data={recoveryData} />
              </div>
            </ParallaxSection>

            {/* Section 4: Performance Metrics (Immersive) */}
            <div className="relative z-20" data-chart="performance-section">
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
              {loadingPersonalization ? (
                <PersonalizationInsightsSkeleton />
              ) : personalizationInsights.length > 0 ? (
                <div className="grid gap-6">
                  {personalizationInsights.map((insight, idx) => (
                    <NeonCard
                      key={idx}
                      className="p-6 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {insight.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                            {insight.description}
                          </p>
                        </div>
                        {insight.confidence && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 ml-4 flex-shrink-0">
                            {Math.round(insight.confidence * 100)}% CONFIDENCE
                          </span>
                        )}
                      </div>
                      {insight.data?.safe_threshold && (
                        <div className="mt-5 p-5 rounded-xl bg-gradient-to-br from-blue-600/10 dark:from-amber-500/10 to-blue-500/5 dark:to-orange-500/5 border border-blue-600/20 dark:border-amber-500/20">
                          <div className="text-xs uppercase tracking-wider text-blue-600 dark:text-amber-400 mb-2 font-semibold">Safe Strain Threshold</div>
                          <div className="text-4xl font-bold text-blue-600 dark:text-amber-300 mb-2">{insight.data.safe_threshold.toFixed(1)}</div>
                          {insight.data.risk_increase_pct && (
                            <div className="text-sm text-blue-600/90 dark:text-amber-400/90 font-medium">
                              Your safe strain threshold is {insight.data.safe_threshold.toFixed(1)} - exceeding this increases burnout risk by {Math.abs(insight.data.risk_increase_pct).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      )}

                      {/* Historical Examples */}
                      {insight.data?.examples && insight.data.examples.length > 0 && (
                        <div className="mt-8">
                          <div className="text-base font-bold text-gray-900 dark:text-white mb-4">
                            Why {insight.data.safe_threshold.toFixed(1)}? Evidence from your data:
                          </div>
                          <div className="space-y-4">
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
                                  className={`p-4 rounded-lg border-2 ${isGood
                                      ? 'bg-blue-600/10 dark:bg-green-500/10 border-blue-600/30 dark:border-green-500/30'
                                      : 'bg-red-500/10 border-red-500/30'
                                    }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${isGood ? 'bg-blue-600 dark:bg-green-400' : 'bg-red-400'
                                        }`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-700 dark:text-white/90 mb-2">
                                          {formattedDate}
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-gray-500 dark:text-white/60">Strain</span>
                                            <span className="text-base font-bold text-gray-900 dark:text-white">{example.strain?.toFixed(1) || 'N/A'}</span>
                                          </div>
                                          <span className="text-gray-400 dark:text-white/40">→</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-gray-500 dark:text-white/60">Recovery</span>
                                            <span className={`text-base font-bold ${isGood ? 'text-blue-600 dark:text-green-400' : 'text-red-500'}`}>
                                              {example.recovery?.toFixed(0) || 'N/A'}%
                                            </span>
                                          </div>
                                        </div>
                                        <div className={`text-sm font-medium mt-2 ${isGood
                                            ? 'text-blue-600/90 dark:text-green-400/90'
                                            : 'text-red-500/90'
                                          }`}>
                                          {isGood ? '✓ Staying below threshold maintained strong recovery' : '⚠ Exceeding threshold led to recovery drop'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`text-xs font-bold px-3 py-1.5 rounded-md flex-shrink-0 ${isGood
                                        ? 'bg-blue-600/20 dark:bg-green-500/20 text-blue-600 dark:text-green-400 border border-blue-600/30 dark:border-green-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      }`}>
                                      {isGood ? 'Good' : 'Risk'}
                                    </div>
                                  </div>
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
          </>
        )}
      </div>
    </AppLayout>
  )
}
