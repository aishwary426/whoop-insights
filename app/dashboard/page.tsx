'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Dumbbell, Zap, Moon, ArrowDown } from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/layout/AppLayout'
import TodayRecommendationCard from '../../components/dashboard/TodayRecommendationCard'
import StatsRow from '../../components/dashboard/StatsRow'
import RecoveryBaselinePanel from '../../components/dashboard/RecoveryBaselinePanel'
import ForecastCard from '../../components/dashboard/ForecastCard'
import NeonButton from '../../components/ui/NeonButton'
import NeonCard from '../../components/ui/NeonCard'
import ParallaxSection from '../../components/ui/ParallaxSection'
import PerformanceSection from '../../components/dashboard/PerformanceSection'
import ScrollReveal from '../../components/ui/ScrollReveal'
import DashboardSkeleton, { PersonalizationInsightsSkeleton } from '../../components/dashboard/DashboardSkeleton'
import { api, type DashboardSummary, type TrendsResponse } from '../../lib/api'
import { getCurrentUser } from '../../lib/auth'
import { useDashboardSummary, useTrends, usePersonalizationInsights } from '../../lib/hooks/useDashboardData'
import { useIsMobile } from '../../lib/hooks/useIsMobile'

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

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const uploaded = searchParams.get('uploaded')
  const [user, setUser] = useState<any>(null)
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
    } else {
      setUser(currentUser)
      setViewingUserId(null)
    }
  }

  // Determine target user ID for data fetching
  const targetUserId = viewingUserId || user?.id

  // SWR Hooks
  const { summary, isLoading: summaryLoading } = useDashboardSummary(targetUserId, uploaded)
  const { trends, isLoading: trendsLoading } = useTrends(undefined, undefined, targetUserId, uploaded)
  const { insights: personalizationInsights, isLoading: personalizationLoading } = usePersonalizationInsights(targetUserId)

  const loading = summaryLoading || trendsLoading
  const loadingPersonalization = personalizationLoading

  // Check if we have data
  const hasRecoveryData = trends?.series?.recovery && trends.series.recovery.length > 0

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
        <DashboardSkeleton />
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>

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
            <ScrollReveal>
              <div className="relative z-20" data-chart="performance-section">
                <PerformanceSection strainData={last30Strain} sleepData={last30Sleep} />
              </div>
            </ScrollReveal>

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
